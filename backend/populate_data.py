#!/usr/bin/env python
"""
Script to populate test data with Arabic names and transactions
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mdc_backend.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from users.models import User
from transactions.models import Transaction, TransactionStatusHistory, Comment

def populate_test_data():
    print('Starting to populate test data...')
    
    # Create admin users
    admin_users = [
        {
            'email': 'admin@mdc.sa',
            'username': 'admin',
            'first_name': 'أحمد',
            'last_name': 'المدير',
            'phone_number': '+966501234567',
            'role': 'admin',
            'language_preference': 'ar'
        }
    ]
    
    # Create editor users with Arabic names
    editor_users = [
        {
            'email': 'mohammed.editor@mdc.sa',
            'username': 'mohammed_editor',
            'first_name': 'محمد',
            'last_name': 'السعيد',
            'phone_number': '+966502345678',
            'role': 'editor',
            'language_preference': 'ar'
        },
        {
            'email': 'fatima.editor@mdc.sa',
            'username': 'fatima_editor',
            'first_name': 'فاطمة',
            'last_name': 'الزهراء',
            'phone_number': '+966503456789',
            'role': 'editor',
            'language_preference': 'ar'
        },
        {
            'email': 'khalid.editor@mdc.sa',
            'username': 'khalid_editor',
            'first_name': 'خالد',
            'last_name': 'العتيبي',
            'phone_number': '+966504567890',
            'role': 'editor',
            'language_preference': 'ar'
        },
        {
            'email': 'noura.editor@mdc.sa',
            'username': 'noura_editor',
            'first_name': 'نورة',
            'last_name': 'القحطاني',
            'phone_number': '+966505678901',
            'role': 'editor',
            'language_preference': 'ar'
        }
    ]
    
    # Create client users with Arabic company names
    client_users = [
        {
            'email': 'abdullah.client@aramco.com',
            'username': 'abdullah_aramco',
            'first_name': 'عبدالله',
            'last_name': 'الرشيد',
            'phone_number': '+966511234567',
            'role': 'client',
            'company_name': 'شركة أرامكو السعودية',
            'language_preference': 'ar'
        },
        {
            'email': 'sara.client@sabic.com',
            'username': 'sara_sabic',
            'first_name': 'سارة',
            'last_name': 'المنصور',
            'phone_number': '+966512345678',
            'role': 'client',
            'company_name': 'شركة سابك',
            'language_preference': 'ar'
        },
        {
            'email': 'omar.client@stc.com',
            'username': 'omar_stc',
            'first_name': 'عمر',
            'last_name': 'الخالدي',
            'phone_number': '+966513456789',
            'role': 'client',
            'company_name': 'شركة الاتصالات السعودية',
            'language_preference': 'ar'
        },
        {
            'email': 'layla.client@almarai.com',
            'username': 'layla_almarai',
            'first_name': 'ليلى',
            'last_name': 'الدوسري',
            'phone_number': '+966514567890',
            'role': 'client',
            'company_name': 'شركة المراعي',
            'language_preference': 'ar'
        },
        {
            'email': 'hassan.client@samba.com',
            'username': 'hassan_samba',
            'first_name': 'حسن',
            'last_name': 'الغامدي',
            'phone_number': '+966515678901',
            'role': 'client',
            'company_name': 'بنك سامبا',
            'language_preference': 'ar'
        }
    ]
    
    # Create all users
    created_admins = []
    created_editors = []
    created_clients = []
    
    for user_data in admin_users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                **user_data,
                'password': make_password('Admin123!'),
                'status': 'active',
                'is_active': True
            }
        )
        created_admins.append(user)
        if created:
            print(f'Created admin: {user.email}')
    
    for user_data in editor_users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                **user_data,
                'password': make_password('Editor123!'),
                'status': 'active',
                'is_active': True
            }
        )
        created_editors.append(user)
        if created:
            print(f'Created editor: {user.email}')
    
    for user_data in client_users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                **user_data,
                'password': make_password('Client123!'),
                'status': 'active',
                'is_active': True
            }
        )
        created_clients.append(user)
        if created:
            print(f'Created client: {user.email}')
    
    # Transaction templates with Arabic content
    transaction_templates = [
        {
            'title_en': 'Construction Permit Application',
            'title_ar': 'طلب رخصة بناء',
            'description_en': 'Application for construction permit for new commercial building',
            'description_ar': 'طلب رخصة بناء لمبنى تجاري جديد',
            'category': 'permit',
            'sub_category': 'construction'
        },
        {
            'title_en': 'Equipment Import Request',
            'title_ar': 'طلب استيراد معدات',
            'description_en': 'Request to import specialized industrial equipment',
            'description_ar': 'طلب استيراد معدات صناعية متخصصة',
            'category': 'import_export',
            'sub_category': 'equipment'
        },
        {
            'title_en': 'Contract Renewal',
            'title_ar': 'تجديد العقد',
            'description_en': 'Annual service contract renewal request',
            'description_ar': 'طلب تجديد عقد الخدمة السنوي',
            'category': 'contract',
            'sub_category': 'renewal'
        },
        {
            'title_en': 'Technical Support Request',
            'title_ar': 'طلب دعم فني',
            'description_en': 'Request for technical support and system maintenance',
            'description_ar': 'طلب دعم فني وصيانة النظام',
            'category': 'support',
            'sub_category': 'technical'
        },
        {
            'title_en': 'Financial Report Submission',
            'title_ar': 'تقديم التقرير المالي',
            'description_en': 'Quarterly financial report submission',
            'description_ar': 'تقديم التقرير المالي ربع السنوي',
            'category': 'report',
            'sub_category': 'financial'
        },
        {
            'title_en': 'Project Proposal',
            'title_ar': 'اقتراح مشروع',
            'description_en': 'New infrastructure development project proposal',
            'description_ar': 'اقتراح مشروع تطوير البنية التحتية الجديد',
            'category': 'proposal',
            'sub_category': 'project'
        },
        {
            'title_en': 'Compliance Certificate',
            'title_ar': 'شهادة الامتثال',
            'description_en': 'Request for regulatory compliance certificate',
            'description_ar': 'طلب شهادة الامتثال التنظيمي',
            'category': 'certificate',
            'sub_category': 'compliance'
        },
        {
            'title_en': 'Vendor Registration',
            'title_ar': 'تسجيل مورد',
            'description_en': 'New vendor registration application',
            'description_ar': 'طلب تسجيل مورد جديد',
            'category': 'registration',
            'sub_category': 'vendor'
        }
    ]
    
    # Status options
    statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'cancelled']
    priorities = ['low', 'normal', 'high', 'urgent']
    
    # Create transactions
    now = timezone.now()
    transactions_created = 0
    
    for i in range(150):  # Create 150 transactions
        # Random dates within last 3 months
        days_ago = random.randint(0, 90)
        created_date = now - timedelta(days=days_ago)
        
        # Select random template
        template = random.choice(transaction_templates)
        
        # Select random client
        client = random.choice(created_clients)
        
        # Select random status
        status = random.choice(statuses)
        
        # Select random priority
        priority = random.choice(priorities)
        
        # Create transaction
        transaction = Transaction.objects.create(
            reference_number=f'TRX-2024-{str(i+1000).zfill(4)}',
            title=template['title_ar'] if client.language_preference == 'ar' else template['title_en'],
            description=template['description_ar'] if client.language_preference == 'ar' else template['description_en'],
            category=template['category'],
            sub_category=template['sub_category'],
            priority=priority,
            status=status,
            client=client,
            created_by=client,
            assigned_to=random.choice(created_editors) if status not in ['draft', 'submitted'] else None,
            created_at=created_date,
            updated_at=created_date + timedelta(hours=random.randint(1, 48))
        )
        
        # Add status history
        TransactionStatusHistory.objects.create(
            transaction=transaction,
            status='draft',
            changed_by=client,
            notes='معاملة جديدة' if client.language_preference == 'ar' else 'New transaction',
            created_at=created_date
        )
        
        if status != 'draft':
            TransactionStatusHistory.objects.create(
                transaction=transaction,
                status='submitted',
                changed_by=client,
                notes='تم التقديم' if client.language_preference == 'ar' else 'Submitted',
                created_at=created_date + timedelta(hours=1)
            )
        
        if status in ['under_review', 'approved', 'rejected', 'completed']:
            TransactionStatusHistory.objects.create(
                transaction=transaction,
                status='under_review',
                changed_by=transaction.assigned_to or created_editors[0],
                notes='قيد المراجعة' if client.language_preference == 'ar' else 'Under review',
                created_at=created_date + timedelta(hours=2)
            )
        
        if status in ['approved', 'completed']:
            TransactionStatusHistory.objects.create(
                transaction=transaction,
                status='approved',
                changed_by=created_admins[0],
                notes='تمت الموافقة' if client.language_preference == 'ar' else 'Approved',
                created_at=created_date + timedelta(hours=24)
            )
        
        if status == 'completed':
            transaction.completed_at = created_date + timedelta(days=random.randint(2, 7))
            transaction.save()
            TransactionStatusHistory.objects.create(
                transaction=transaction,
                status='completed',
                changed_by=transaction.assigned_to or created_editors[0],
                notes='اكتملت المعاملة' if client.language_preference == 'ar' else 'Transaction completed',
                created_at=transaction.completed_at
            )
        
        # Add some comments randomly
        if random.random() > 0.5:
            Comment.objects.create(
                transaction=transaction,
                user=random.choice(created_editors + [client]),
                content='يرجى تقديم المستندات المطلوبة' if random.random() > 0.5 else 'Please provide required documents',
                created_at=created_date + timedelta(hours=random.randint(3, 72))
            )
        
        transactions_created += 1
        
        if transactions_created % 10 == 0:
            print(f'Created {transactions_created} transactions...')
    
    print(f"""
✅ Successfully populated test data:
- {len(created_admins)} admin users
- {len(created_editors)} editor users  
- {len(created_clients)} client users
- {transactions_created} transactions with Arabic content

Login credentials:
- Admin: admin@mdc.sa / Admin123!
- Editor: mohammed.editor@mdc.sa / Editor123!
- Client: abdullah.client@aramco.com / Client123!
    """)

if __name__ == '__main__':
    populate_test_data()