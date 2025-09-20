"""
Report generation utilities for MDC Transaction Tracking System
"""

import io
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import xlsxwriter
from io import BytesIO


class PDFReportGenerator:
    """
    Generate PDF reports for various system data
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._add_custom_styles()
    
    def _add_custom_styles(self):
        """Add custom styles for MDC reports"""
        self.styles.add(ParagraphStyle(
            name='MDCTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#2d3139'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='MDCHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#2d3139'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='MDCSubHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d3139'),
            spaceAfter=10,
            spaceBefore=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='MDCBody',
            parent=self.styles['BodyText'],
            fontSize=10,
            alignment=TA_LEFT
        ))
        
        self.styles.add(ParagraphStyle(
            name='MDCFooter',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        ))
    
    def _add_header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()
        
        # Header
        canvas.setFont('Helvetica-Bold', 10)
        canvas.drawString(inch, doc.height + 0.75 * inch, "MDC Transaction Tracking System")
        canvas.drawRightString(doc.width + inch, doc.height + 0.75 * inch, 
                               datetime.now().strftime("%Y-%m-%d %H:%M"))
        
        # Footer
        canvas.setFont('Helvetica', 8)
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawCentredString(doc.width / 2 + inch, 0.5 * inch, text)
        
        # Line separators
        canvas.setStrokeColor(colors.grey)
        canvas.setLineWidth(0.5)
        canvas.line(inch, doc.height + 0.65 * inch, doc.width + inch, doc.height + 0.65 * inch)
        canvas.line(inch, 0.65 * inch, doc.width + inch, 0.65 * inch)
        
        canvas.restoreState()
    
    def generate_transaction_report(self, transactions, title="Transaction Report"):
        """
        Generate PDF report for transactions
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph(title, self.styles['MDCTitle']))
        story.append(Spacer(1, 12))
        
        # Report metadata
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 
                              self.styles['MDCBody']))
        story.append(Paragraph(f"Total Transactions: {len(transactions)}", 
                              self.styles['MDCBody']))
        story.append(Spacer(1, 20))
        
        # Transaction table
        if transactions:
            data = [['Transaction ID', 'Client', 'Status', 'Priority', 'Created', 'Due Date']]
            
            for txn in transactions:
                data.append([
                    txn.transaction_id[:20],
                    txn.client_name[:25],
                    txn.status.title(),
                    txn.priority.title(),
                    txn.created_at.strftime('%Y-%m-%d') if txn.created_at else '-',
                    txn.due_date.strftime('%Y-%m-%d') if txn.due_date else '-'
                ])
            
            # Create table
            table = Table(data, colWidths=[1.5*inch, 1.8*inch, 1*inch, 0.8*inch, 1*inch, 1*inch])
            
            # Apply table style
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3139')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(table)
        else:
            story.append(Paragraph("No transactions found.", self.styles['MDCBody']))
        
        # Build PDF
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
        
        buffer.seek(0)
        return buffer
    
    def generate_analytics_report(self, analytics_data, title="Analytics Report"):
        """
        Generate PDF report for analytics data
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph(title, self.styles['MDCTitle']))
        story.append(Spacer(1, 12))
        
        # Summary section
        story.append(Paragraph("Executive Summary", self.styles['MDCHeading']))
        
        if 'summary' in analytics_data:
            for key, value in analytics_data['summary'].items():
                story.append(Paragraph(f"{key}: {value}", self.styles['MDCBody']))
        
        story.append(Spacer(1, 20))
        
        # Statistics sections
        for section_name, section_data in analytics_data.items():
            if section_name == 'summary':
                continue
                
            story.append(Paragraph(section_name.replace('_', ' ').title(), self.styles['MDCSubHeading']))
            
            if isinstance(section_data, dict):
                data = [['Metric', 'Value']]
                for key, value in section_data.items():
                    data.append([key.replace('_', ' ').title(), str(value)])
                
                table = Table(data, colWidths=[3*inch, 2*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3139')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ]))
                story.append(table)
            
            elif isinstance(section_data, list) and section_data:
                # Handle list data
                if isinstance(section_data[0], dict):
                    keys = list(section_data[0].keys())[:5]  # Limit to 5 columns
                    data = [keys]
                    for item in section_data[:20]:  # Limit to 20 rows
                        row = [str(item.get(k, ''))[:30] for k in keys]
                        data.append(row)
                    
                    table = Table(data)
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3139')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                    ]))
                    story.append(table)
            
            story.append(Spacer(1, 15))
        
        # Build PDF
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
        
        buffer.seek(0)
        return buffer
    
    def generate_audit_report(self, audit_logs, title="Audit Log Report"):
        """
        Generate PDF report for audit logs
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph(title, self.styles['MDCTitle']))
        story.append(Spacer(1, 12))
        
        # Report metadata
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 
                              self.styles['MDCBody']))
        story.append(Paragraph(f"Total Entries: {len(audit_logs)}", 
                              self.styles['MDCBody']))
        story.append(Spacer(1, 20))
        
        # Audit log table
        if audit_logs:
            data = [['User', 'Action', 'Resource', 'Timestamp', 'IP Address']]
            
            for log in audit_logs[:100]:  # Limit to 100 entries
                data.append([
                    log.user.username if log.user else 'System',
                    log.action[:20],
                    f"{log.table_name}:{log.record_id}" if log.table_name else '-',
                    log.created_at.strftime('%Y-%m-%d %H:%M'),
                    log.ip_address or '-'
                ])
            
            # Create table
            table = Table(data, colWidths=[1.2*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1.3*inch])
            
            # Apply table style
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3139')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(table)
        else:
            story.append(Paragraph("No audit logs found.", self.styles['MDCBody']))
        
        # Build PDF
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
        
        buffer.seek(0)
        return buffer


class ExcelReportGenerator:
    """
    Generate Excel reports for various system data
    """
    
    def generate_transaction_report(self, transactions, title="Transaction Report"):
        """
        Generate Excel report for transactions
        """
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Transactions')
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#2d3139',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        date_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'num_format': 'yyyy-mm-dd'
        })
        
        # Write headers
        headers = [
            'Transaction ID', 'Reference Number', 'Client Name', 'Client Email',
            'Transaction Type', 'Category', 'Status', 'Priority',
            'Assigned To', 'Created By', 'Created At', 'Due Date',
            'Description', 'Department', 'Comments Count', 'Attachments Count'
        ]
        
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        # Write data
        for row, txn in enumerate(transactions, start=1):
            worksheet.write(row, 0, txn.transaction_id, cell_format)
            worksheet.write(row, 1, txn.reference_number or '', cell_format)
            worksheet.write(row, 2, txn.client_name or '', cell_format)
            worksheet.write(row, 3, txn.client.email if txn.client else '', cell_format)
            worksheet.write(row, 4, txn.transaction_type or '', cell_format)
            worksheet.write(row, 5, txn.category or '', cell_format)
            worksheet.write(row, 6, txn.status, cell_format)
            worksheet.write(row, 7, txn.priority, cell_format)
            worksheet.write(row, 8, txn.assigned_to.get_full_name() if txn.assigned_to else '', cell_format)
            worksheet.write(row, 9, txn.created_by.get_full_name() if txn.created_by else '', cell_format)
            worksheet.write_datetime(row, 10, txn.created_at.replace(tzinfo=None) if txn.created_at else '', date_format)
            worksheet.write_datetime(row, 11, txn.due_date if txn.due_date else '', date_format)
            worksheet.write(row, 12, txn.description or '', cell_format)
            worksheet.write(row, 13, txn.department or '', cell_format)
            worksheet.write(row, 14, txn.comments.filter(is_deleted=False).count(), cell_format)
            worksheet.write(row, 15, txn.attachments.filter(is_deleted=False).count(), cell_format)
        
        # Auto-fit columns
        for col in range(len(headers)):
            worksheet.set_column(col, col, 15)
        
        # Add summary sheet
        summary_sheet = workbook.add_worksheet('Summary')
        
        # Summary statistics
        summary_data = [
            ['Metric', 'Value'],
            ['Total Transactions', len(transactions)],
            ['Pending', sum(1 for t in transactions if t.status == 'draft')],
            ['In Progress', sum(1 for t in transactions if t.status == 'in_progress')],
            ['Completed', sum(1 for t in transactions if t.status == 'completed')],
            ['High Priority', sum(1 for t in transactions if t.priority == 'urgent')],
            ['Overdue', sum(1 for t in transactions if t.due_date and t.due_date < timezone.now().date() and t.status != 'completed')],
        ]
        
        for row, data in enumerate(summary_data):
            for col, value in enumerate(data):
                if row == 0:
                    summary_sheet.write(row, col, value, header_format)
                else:
                    summary_sheet.write(row, col, value, cell_format)
        
        summary_sheet.set_column(0, 0, 20)
        summary_sheet.set_column(1, 1, 15)
        
        workbook.close()
        output.seek(0)
        
        return output
    
    def generate_analytics_report(self, analytics_data, title="Analytics Report"):
        """
        Generate Excel report for analytics data
        """
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#2d3139',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        number_format = workbook.add_format({
            'border': 1,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0'
        })
        
        percent_format = workbook.add_format({
            'border': 1,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '0.00%'
        })
        
        # Create sheets for different analytics sections
        for section_name, section_data in analytics_data.items():
            # Create worksheet with valid name
            sheet_name = section_name.replace('_', ' ').title()[:31]  # Excel sheet name limit
            worksheet = workbook.add_worksheet(sheet_name)
            
            if isinstance(section_data, dict):
                # Write dictionary data
                worksheet.write(0, 0, 'Metric', header_format)
                worksheet.write(0, 1, 'Value', header_format)
                
                row = 1
                for key, value in section_data.items():
                    worksheet.write(row, 0, key.replace('_', ' ').title(), cell_format)
                    
                    if isinstance(value, (int, float)):
                        if 'percent' in key or 'rate' in key:
                            worksheet.write(row, 1, value / 100, percent_format)
                        else:
                            worksheet.write(row, 1, value, number_format)
                    else:
                        worksheet.write(row, 1, str(value), cell_format)
                    
                    row += 1
                
                worksheet.set_column(0, 0, 30)
                worksheet.set_column(1, 1, 20)
                
            elif isinstance(section_data, list) and section_data:
                # Write list data
                if isinstance(section_data[0], dict):
                    # Write headers
                    headers = list(section_data[0].keys())
                    for col, header in enumerate(headers):
                        worksheet.write(0, col, header.replace('_', ' ').title(), header_format)
                    
                    # Write data
                    for row, item in enumerate(section_data, start=1):
                        for col, header in enumerate(headers):
                            value = item.get(header, '')
                            if isinstance(value, (int, float)):
                                worksheet.write(row, col, value, number_format)
                            else:
                                worksheet.write(row, col, str(value), cell_format)
                    
                    # Auto-fit columns
                    for col in range(len(headers)):
                        worksheet.set_column(col, col, 15)
        
        workbook.close()
        output.seek(0)
        
        return output
    
    def generate_user_report(self, users, title="User Report"):
        """
        Generate Excel report for users
        """
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Users')
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#2d3139',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        date_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'num_format': 'yyyy-mm-dd hh:mm'
        })
        
        # Write headers
        headers = [
            'Username', 'Email', 'Full Name', 'Role', 'Status',
            'Company', 'Department', 'Phone', 'Date Joined',
            'Last Login', 'Transactions Created', 'Transactions Assigned'
        ]
        
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        # Write data
        for row, user in enumerate(users, start=1):
            worksheet.write(row, 0, user.username, cell_format)
            worksheet.write(row, 1, user.email, cell_format)
            worksheet.write(row, 2, user.get_full_name(), cell_format)
            worksheet.write(row, 3, user.get_role_display(), cell_format)
            worksheet.write(row, 4, user.get_status_display(), cell_format)
            worksheet.write(row, 5, user.company_name or '', cell_format)
            worksheet.write(row, 6, user.department or '', cell_format)
            worksheet.write(row, 7, user.phone_number or '', cell_format)
            worksheet.write_datetime(row, 8, user.date_joined.replace(tzinfo=None) if user.date_joined else '', date_format)
            worksheet.write_datetime(row, 9, user.last_login.replace(tzinfo=None) if user.last_login else '', date_format)
            worksheet.write(row, 10, user.created_transactions.count(), cell_format)
            worksheet.write(row, 11, user.assigned_transactions.count(), cell_format)
        
        # Auto-fit columns
        for col in range(len(headers)):
            worksheet.set_column(col, col, 15)
        
        workbook.close()
        output.seek(0)
        
        return output
    
    def generate_custom_report(self, data, format_settings=None):
        """
        Generate Excel report from custom data
        """
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Custom Report')
        
        # Apply custom format settings
        settings = format_settings or {}
        
        # Header format
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': settings.get('header_bg_color', '#2d3139'),
            'font_color': settings.get('header_font_color', 'white'),
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        if not data:
            worksheet.write(0, 0, 'No data available', cell_format)
            workbook.close()
            output.seek(0)
            return output
        
        # Get headers from first data row
        headers = list(data[0].keys()) if data else []
        
        # Write headers
        for col, header in enumerate(headers):
            worksheet.write(0, col, str(header).replace('_', ' ').title(), header_format)
        
        # Write data
        for row, item in enumerate(data, start=1):
            for col, header in enumerate(headers):
                value = item.get(header, '')
                if value is None:
                    value = ''
                worksheet.write(row, col, str(value), cell_format)
        
        # Auto-fit columns
        for col in range(len(headers)):
            worksheet.set_column(col, col, 15)
        
        workbook.close()
        output.seek(0)
        
        return output


class PDFReportGenerator:
    """Enhanced PDF Report Generator with custom report support"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._add_custom_styles()
    
    def _add_custom_styles(self):
        """Add custom styles for MDC reports"""
        self.styles.add(ParagraphStyle(
            name='MDCTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#2d3139'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='MDCHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#2d3139'),
            spaceAfter=12,
            spaceBefore=12
        ))
    
    def generate_custom_report(self, data, title, format_settings=None):
        """
        Generate PDF report from custom data
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        story = []
        settings = format_settings or {}
        
        # Title
        story.append(Paragraph(title, self.styles['MDCTitle']))
        story.append(Spacer(1, 20))
        
        # Generation info
        story.append(Paragraph(
            f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 20))
        
        if not data:
            story.append(Paragraph("No data available", self.styles['Normal']))
        else:
            # Get headers from first data row
            headers = list(data[0].keys()) if data else []
            
            # Create table data
            table_data = []
            
            # Headers
            header_row = [str(h).replace('_', ' ').title() for h in headers]
            table_data.append(header_row)
            
            # Data rows
            for item in data:
                row = []
                for header in headers:
                    value = item.get(header, '')
                    if value is None:
                        value = ''
                    row.append(str(value))
                table_data.append(row)
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3139')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return buffer


def generate_report_response(buffer, filename, format='pdf'):
    """
    Generate HTTP response for report download
    """
    if format == 'pdf':
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
    elif format == 'excel':
        response = HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
    else:
        raise ValueError(f"Unsupported format: {format}")
    
    return response