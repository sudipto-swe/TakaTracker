"""
Management command to seed the RBAC database tables.

Creates default Roles, Permissions, and RolePermission mappings
as defined in the RBAC permission matrix.

Usage:
    python manage.py seed_rbac          # Seed all
    python manage.py seed_rbac --reset  # Clear and re-seed
"""
from django.core.management.base import BaseCommand
from apps.users.models import Role, Permission, RolePermission


# ═══════════════════════════════════════════════════════════════════
#  RBAC Permission Matrix
# ═══════════════════════════════════════════════════════════════════
#
#  Format: (codename, name, name_bn, category)
#
PERMISSIONS = [
    # Dashboard
    ('view:dashboard', 'View Dashboard', 'ড্যাশবোর্ড দেখুন', 'dashboard'),

    # Transactions
    ('create:transaction', 'Create Transaction', 'লেনদেন তৈরি করুন', 'transaction'),
    ('view:transaction', 'View Transactions', 'লেনদেন দেখুন', 'transaction'),
    ('edit:transaction', 'Edit Transaction', 'লেনদেন সম্পাদনা করুন', 'transaction'),
    ('delete:transaction', 'Delete Transaction', 'লেনদেন মুছুন', 'transaction'),

    # Contacts
    ('view:contact', 'View Contacts', 'যোগাযোগ দেখুন', 'contact'),
    ('create:contact', 'Create Contact', 'যোগাযোগ তৈরি করুন', 'contact'),
    ('edit:contact', 'Edit Contact', 'যোগাযোগ সম্পাদনা করুন', 'contact'),
    ('delete:contact', 'Delete Contact', 'যোগাযোগ মুছুন', 'contact'),

    # Inventory
    ('view:inventory', 'View Inventory', 'ইনভেন্টরি দেখুন', 'inventory'),
    ('manage:inventory', 'Manage Inventory', 'ইনভেন্টরি পরিচালনা', 'inventory'),

    # Reports
    ('view:reports', 'View Reports', 'রিপোর্ট দেখুন', 'reports'),

    # Payments
    ('manage:payments', 'Manage Payments', 'পেমেন্ট পরিচালনা', 'payments'),

    # Staff
    ('manage:staff', 'Manage Staff', 'কর্মচারী পরিচালনা', 'staff'),

    # Settings
    ('manage:settings', 'Manage Settings', 'সেটিংস পরিচালনা', 'settings'),

    # Notifications
    ('view:notifications', 'View Notifications', 'নোটিফিকেশন দেখুন', 'notifications'),
]

# Roles and their permissions
ROLES = {
    'merchant': {
        'display_name': 'Merchant',
        'display_name_bn': 'ব্যবসায়ী',
        'description': 'Business owner with full access',
        'is_default': True,
        'permissions': [
            'view:dashboard',
            'create:transaction', 'view:transaction', 'edit:transaction', 'delete:transaction',
            'view:contact', 'create:contact', 'edit:contact', 'delete:contact',
            'view:inventory', 'manage:inventory',
            'view:reports',
            'manage:payments',
            'manage:staff',
            'manage:settings',
            'view:notifications',
        ],
    },
    'staff': {
        'display_name': 'Staff',
        'display_name_bn': 'কর্মচারী',
        'description': 'Employee with limited access',
        'is_default': False,
        'permissions': [
            'view:dashboard',
            'create:transaction', 'view:transaction',
            'view:contact', 'create:contact',
            'view:inventory',
            'view:notifications',
        ],
    },
    'admin': {
        'display_name': 'Admin',
        'display_name_bn': 'অ্যাডমিন',
        'description': 'System administrator with full access',
        'is_default': False,
        'permissions': [
            'view:dashboard',
            'create:transaction', 'view:transaction', 'edit:transaction', 'delete:transaction',
            'view:contact', 'create:contact', 'edit:contact', 'delete:contact',
            'view:inventory', 'manage:inventory',
            'view:reports',
            'manage:payments',
            'manage:staff',
            'manage:settings',
            'view:notifications',
        ],
    },
}


class Command(BaseCommand):
    help = 'Seed RBAC roles, permissions, and role-permission mappings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all existing RBAC data before seeding',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('⚠  Clearing existing RBAC data...'))
            RolePermission.objects.all().delete()
            Permission.objects.all().delete()
            Role.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('   Cleared.'))

        # 1. Create Permissions
        self.stdout.write('\n📋 Creating permissions...')
        perm_objects = {}
        for codename, name, name_bn, category in PERMISSIONS:
            perm, created = Permission.objects.update_or_create(
                codename=codename,
                defaults={
                    'name': name,
                    'name_bn': name_bn,
                    'category': category,
                }
            )
            perm_objects[codename] = perm
            status = '✅ Created' if created else '🔄 Updated'
            self.stdout.write(f'   {status}: {codename}')

        # 2. Create Roles
        self.stdout.write('\n👥 Creating roles...')
        role_objects = {}
        for role_name, config in ROLES.items():
            role, created = Role.objects.update_or_create(
                name=role_name,
                defaults={
                    'display_name': config['display_name'],
                    'display_name_bn': config['display_name_bn'],
                    'description': config['description'],
                    'is_default': config['is_default'],
                }
            )
            role_objects[role_name] = role
            status = '✅ Created' if created else '🔄 Updated'
            self.stdout.write(f'   {status}: {role_name} ({config["display_name_bn"]})')

        # 3. Create RolePermission mappings
        self.stdout.write('\n🔗 Creating role-permission mappings...')
        total_created = 0
        total_existing = 0
        for role_name, config in ROLES.items():
            role = role_objects[role_name]
            for perm_codename in config['permissions']:
                perm = perm_objects.get(perm_codename)
                if not perm:
                    self.stdout.write(
                        self.style.ERROR(f'   ❌ Permission not found: {perm_codename}')
                    )
                    continue
                _, created = RolePermission.objects.get_or_create(
                    role=role,
                    permission=perm,
                )
                if created:
                    total_created += 1
                else:
                    total_existing += 1

        self.stdout.write(f'   ✅ {total_created} mappings created, {total_existing} already existed')

        # 4. Link existing users to their RBAC roles
        self.stdout.write('\n👤 Linking existing users to RBAC roles...')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        linked = 0
        for user in User.objects.filter(rbac_role__isnull=True):
            role = role_objects.get(user.role)
            if role:
                user.rbac_role = role
                user.save(update_fields=['rbac_role'])
                linked += 1
                self.stdout.write(f'   🔗 {user.phone} → {role.name}')

        self.stdout.write(f'   ✅ {linked} users linked')

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f'\n🎉 RBAC seed complete!'
            f'\n   Permissions: {len(PERMISSIONS)}'
            f'\n   Roles: {len(ROLES)}'
            f'\n   Mappings: {total_created + total_existing}'
            f'\n   Users linked: {linked}'
        ))
