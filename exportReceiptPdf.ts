import { jsPDF } from 'jspdf';
import { Candidate } from '../data/imfaData';
import { candidateToPublicApp } from '../data/initialData';

export function exportCandidateReceiptPdf(candidate: Candidate): string {
  const pub = candidateToPublicApp(candidate);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Outer card border
  doc.setDrawColor(16, 42, 67);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, 14, contentWidth, 265, 4, 4, 'S');

  // 1. HEADER BANNER (#102A43)
  doc.setFillColor(16, 42, 67);
  doc.roundedRect(margin, 14, contentWidth, 34, 4, 4, 'F');
  // Square off bottom corners of header
  doc.rect(margin, 40, contentWidth, 8, 'F');

  // Burgundy accent bottom border (#8F1725)
  doc.setFillColor(143, 23, 37);
  doc.rect(margin, 47, contentWidth, 2, 'F');

  // Emblem Badge Circle on Left
  doc.setFillColor(247, 190, 44);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.circle(margin + 13, 31, 8.5, 'FD');
  doc.setFillColor(16, 42, 67);
  doc.circle(margin + 13, 31, 6.2, 'F');
  doc.setTextColor(247, 190, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITPGQ', margin + 13, 32.2, { align: 'center' });

  // Header Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('COMPROVATIVO OFICIAL DE CANDIDATURA — 10.ª CLASSE', margin + 25, 29);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'Instituto Técnico Privado de Gestão Quineus (ITPGQ) • Ano Lectivo 2026–2027',
    margin + 25,
    35.5
  );

  // Process Number Box on Right of Header
  const procBoxW = 48;
  const procBoxX = pageWidth - margin - procBoxW - 5;
  doc.setFillColor(26, 56, 87);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.roundedRect(procBoxX, 19.5, procBoxW, 22, 2.5, 2.5, 'FD');

  doc.setTextColor(240, 192, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Nº DE PROCESSO OFICIAL', procBoxX + procBoxW - 3, 25, { align: 'right' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.text(candidate.id, procBoxX + procBoxW - 3, 32, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Código: ${pub.serialCode}`, procBoxX + procBoxW - 3, 38, { align: 'right' });

  // 2. CANDIDATE AVATAR & MAIN IDENTIFICATION GRID
  let curY = 56;

  // Left Passport Box
  const passportX = margin + 6;
  const passportW = 38;
  const passportH = 54;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(passportX, curY, passportW, passportH, 3, 3, 'FD');

  // Inner Avatar Frame
  const hasDataPhoto =
    candidate.photoUrl &&
    candidate.photoUrl.startsWith('data:image/') &&
    !candidate.photoUrl.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk');

  if (hasDataPhoto) {
    try {
      const imgFormat = candidate.photoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(candidate.photoUrl, imgFormat, passportX + 5, curY + 4, passportW - 10, 34);
    } catch {
      doc.setFillColor(16, 42, 67);
      doc.roundedRect(passportX + 5, curY + 4, passportW - 10, 34, 2, 2, 'F');
      doc.setTextColor(240, 192, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(candidate.initials, passportX + passportW / 2, curY + 23.5, { align: 'center' });
    }
  } else {
    doc.setFillColor(16, 42, 67);
    doc.roundedRect(passportX + 5, curY + 4, passportW - 10, 34, 2, 2, 'F');
    doc.setTextColor(240, 192, 68);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(candidate.initials, passportX + passportW / 2, curY + 23.5, { align: 'center' });
  }

  doc.setTextColor(51, 65, 85);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(pub.serialCode, passportX + passportW / 2, curY + 44, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('FOTOGRAFIA VALIDADA', passportX + passportW / 2, curY + 49, { align: 'center' });

  // Right 2x3 Info Grid
  const gridX = passportX + passportW + 5;
  const gridW = pageWidth - margin - 6 - gridX;
  const colW = (gridW - 4) / 2;
  const cellH = 16.5;

  const drawInfoCell = (
    x: number,
    y: number,
    w: number,
    label: string,
    value: string,
    highlight = false
  ) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(235, 240, 245);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, cellH, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(label.toUpperCase(), x + 3.5, y + 5.5);

    if (highlight) {
      doc.setTextColor(143, 23, 37);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const truncated = doc.splitTextToSize(value, w - 7)[0] || value;
    doc.text(truncated, x + 3.5, y + 12);
  };

  // Row 1
  drawInfoCell(gridX, curY, colW, 'Nome Completo do Candidato', candidate.fullName);
  drawInfoCell(gridX + colW + 4, curY, colW, 'Bilhete de Identidade (BI)', candidate.biNumber);

  // Row 2
  drawInfoCell(
    gridX,
    curY + cellH + 2.2,
    colW,
    'Curso Técnico Homologado',
    `${candidate.courseName} (${candidate.courseCode})`,
    true
  );
  drawInfoCell(
    gridX + colW + 4,
    curY + cellH + 2.2,
    colW,
    'Turma / Turno Atribuído',
    `Turma ${candidate.classCode} • ${candidate.shift}`
  );

  // Row 3
  drawInfoCell(
    gridX,
    curY + (cellH + 2.2) * 2,
    colW,
    'Escola de Proveniência (9.ª Classe)',
    candidate.previousSchool
  );
  drawInfoCell(
    gridX + colW + 4,
    curY + (cellH + 2.2) * 2,
    colW,
    'Média de Acesso & Estado Atual',
    `${candidate.averageGrade.toFixed(1)} Valores • ${pub.status}`,
    true
  );

  // 3. CONTACTOS & DADOS COMPLEMENTARES
  curY += passportH + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 6, curY, contentWidth - 12, 16, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DATA DE NASCIMENTO / GÉNERO', margin + 10, curY + 5.5);
  doc.text('TELEFONE PRINCIPAL', margin + 72, curY + 5.5);
  doc.text('MUNICÍPIO / RESIDÊNCIA', margin + 125, curY + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(
    `${candidate.birthDate} (${candidate.age} anos) • ${candidate.gender}`,
    margin + 10,
    curY + 11.8
  );
  doc.text(candidate.phonePrimary, margin + 72, curY + 11.8);
  const resText =
    doc.splitTextToSize(candidate.municipalityLabel || candidate.address, 62)[0] ||
    candidate.municipalityLabel;
  doc.text(resText, margin + 125, curY + 11.8);

  // 4. CLASSIFICAÇÕES DO CERTIFICADO DA 9.ª CLASSE
  curY += 22;
  doc.setTextColor(16, 42, 67);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CLASSIFICAÇÕES DE ACESSO DA 9.ª CLASSE (ESCALA 0–20 VALORES)', margin + 6, curY);

  curY += 3;
  const gradeBoxW = (contentWidth - 12 - 9) / 4;
  const gradesList = [
    { label: 'Matemática', val: `${candidate.grades.matematica} Valores` },
    { label: 'Língua Portuguesa', val: `${candidate.grades.portugues} Valores` },
    { label: 'Física', val: `${candidate.grades.fisica} Valores` },
    { label: 'Química', val: `${candidate.grades.quimica} Valores` },
  ];

  gradesList.forEach((g, idx) => {
    const gx = margin + 6 + idx * (gradeBoxW + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(gx, curY, gradeBoxW, 14, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(g.label.toUpperCase(), gx + 3, curY + 5.2);

    doc.setTextColor(16, 42, 67);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text(g.val, gx + 3, curY + 11.2);
  });

  // 5. DOCUMENTOS ANEXADOS E AUDITORIA
  curY += 21;
  doc.setTextColor(16, 42, 67);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    `DOCUMENTOS SUBMETIDOS & ESTADO DE VALIDAÇÃO (${candidate.docSummaryLabel.toUpperCase()})`,
    margin + 6,
    curY
  );

  curY += 3;
  candidate.documents.forEach((d, idx) => {
    const dy = curY + idx * 10.5;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 6, dy, contentWidth - 12, 9, 1.5, 1.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text(d.title, margin + 9, dy + 5.8);

    doc.setTextColor(100, 116, 139);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.2);
    doc.text(d.filename, margin + 78, dy + 5.8);

    const statusLabel =
      d.status === 'validado'
        ? 'VALIDADO'
        : d.status === 'ilegivel'
        ? 'RECUSADO / ILEGÍVEL'
        : 'EM VERIFICAÇÃO';

    if (d.status === 'validado') {
      doc.setTextColor(6, 95, 70);
    } else if (d.status === 'ilegivel') {
      doc.setTextColor(153, 27, 27);
    } else {
      doc.setTextColor(146, 64, 14);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(statusLabel, pageWidth - margin - 9, dy + 5.8, { align: 'right' });
  });

  // 6. PARECER DA COMISSÃO PEDAGÓGICA
  curY += candidate.documents.length * 10.5 + 5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(16, 42, 67);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 6, curY, contentWidth - 12, 19, 2, 2, 'FD');

  doc.setTextColor(143, 23, 37);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DESPACHO / PARECER OFICIAL DA COMISSÃO PEDAGÓGICA:', margin + 9, curY + 5.5);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  const dispatchLines = doc.splitTextToSize(candidate.dispatchNote, contentWidth - 18);
  doc.text(dispatchLines.slice(0, 2), margin + 9, curY + 11.2);

  // 7. DATA DE SUBMISSÃO & CARIMBO DE SINCRONIZAÇÃO
  curY += 24;
  doc.setFillColor(238, 242, 246);
  doc.setDrawColor(16, 42, 67);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 6, curY, contentWidth - 12, 16, 2.5, 2.5, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.text(
    `Submetido em: ${candidate.submittedDate} ${candidate.submittedTime}`,
    margin + 10,
    curY + 9.5
  );

  // Verified Badge Box on Right
  const badgeW = 68;
  const badgeX = pageWidth - margin - 6 - badgeW - 4;
  doc.setFillColor(209, 250, 229);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(badgeX, curY + 2, badgeW, 12, 2, 2, 'FD');

  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(
    'REGISTO SINCRONIZADO COM A SECRETARIA ITPGQ',
    badgeX + badgeW / 2,
    curY + 9,
    { align: 'center' }
  );

  // 8. FOOTER SIGNATURE & TIMESTAMP
  curY += 31;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin + 10, curY, margin + 75, curY);
  doc.line(pageWidth - margin - 75, curY, pageWidth - margin - 10, curY);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('A Secretaria Académica do ITPGQ', margin + 42.5, curY + 4.5, { align: 'center' });
  doc.text('A Comissão Pedagógica de Admissão', pageWidth - margin - 42.5, curY + 4.5, {
    align: 'center',
  });

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(
    `Documento emitido eletronicamente pelo Portal de Admissões ITPGQ • Luanda, Angola • Processo ${candidate.id}`,
    pageWidth / 2,
    274,
    { align: 'center' }
  );

  const fileName = `Comprovativo_ITPGQ_${candidate.id}.pdf`;
  doc.save(fileName);
  return fileName;
}
