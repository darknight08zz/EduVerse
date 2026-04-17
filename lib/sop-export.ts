import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export async function exportToDocx(content: string, university: string, program: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Statement of Purpose",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${university} | ${program}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),
          ...content.split('\n').filter(p => p.trim()).map(p => 
            new Paragraph({
              children: [
                new TextRun({
                  text: p.trim(),
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `SOP_${university.replace(/\s+/g, '_')}.docx`);
}

export function exportToTxt(content: string, university: string) {
  const element = document.createElement("a");
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `SOP_${university.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
