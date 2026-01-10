import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LetterGrade } from '../types';

export interface StudentPDFData {
  studentName: string;
  items: {
    name: string;
    score: number;
    maxPoints: number;
  }[];
  total: number;
  maxPossible: number;
  percentage: number;
  letterGrade: string | null;
}

export function generateAssignmentPDF(
  assignmentName: string,
  assignmentDate: string,
  studentData: StudentPDFData[],
  letterGrades: LetterGrade[]
): void {
  // Helper function to format numbers without trailing zeros
  const formatNumber = (num: number): string => {
    return Number(num.toFixed(2)).toString();
  };

  const doc = new jsPDF();
  let isFirstPage = true;

  studentData.forEach((student) => {
    // Add page break for subsequent students
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    // Student name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(student.studentName, 15, 20);

    // Table with grades
    if (student.items.length > 0) {
      // Build table body with items and total row
      const tableBody = [
        ...student.items.map(item => [
          item.name,
          formatNumber(item.score),
          formatNumber(item.maxPoints)
        ]),
        [
          'Total',
          formatNumber(student.total),
          formatNumber(student.maxPossible)
        ]
      ];

      autoTable(doc, {
        head: [['', 'Score', 'Possible']],
        body: tableBody,
        startY: 30,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' }
        },
        didParseCell: function(data) {
          // Make the last row (total) bold
          if (data.section === 'body' && data.row.index === tableBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Summary section (after table)
      const finalY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');

      if (student.letterGrade && letterGrades.length > 0) {
        doc.text(
          `${Math.round(student.percentage)}% (${student.letterGrade})`,
          15,
          finalY
        );
      } else {
        doc.text(
          `${Math.round(student.percentage)}%`,
          15,
          finalY
        );
      }
    } else {
      // No grades entered
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No grades entered for this assignment.', 15, 35);
      doc.setTextColor(0, 0, 0); // Reset to black
    }
  });

  // Generate safe filename
  const dateStr = new Date(assignmentDate).toISOString().split('T')[0];
  const safeName = assignmentName.replace(/[^a-z0-9]/gi, '_');
  const filename = `${safeName}_${dateStr}.pdf`;

  doc.save(filename);
}
