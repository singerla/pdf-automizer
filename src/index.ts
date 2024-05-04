import fs from 'fs';
import { PDFDocument, PDFTextField } from 'pdf-lib';

export type FieldInfo = {
  name: string;
  type: string;
  value?: string;
  field: PDFTextField;
  update: (str: string) => void;
};

export interface IModifyPage {
  fields: FieldInfo[];
}

export type PageModification = (page: IModifyPage) => void;

export default class PDFAutomizer {
  templatePdf: PDFDocument;
  outputPdf: PDFDocument;
  modifications: {
    page: number;
    mods: PageModification[];
  }[] = [];
  fields: FieldInfo[] = [];

  constructor(templatePdf: PDFDocument, outputPdf: PDFDocument) {
    this.templatePdf = templatePdf;
    this.outputPdf = outputPdf;
  }

  static async loadPdf(filename: string) {
    const existingPdfBytes = fs.readFileSync(filename);
    return PDFDocument.load(existingPdfBytes);
  }

  static async createPdf() {
    return PDFDocument.create();
  }

  async readFieldNames() {
    const form = this.templatePdf.getForm();
    const fields = form.getFields();
    const info = <FieldInfo[]>[];
    fields.forEach((field) => {
      const type = field.constructor.name;
      const name = field.getName();

      if (type === 'PDFTextField') {
        this.pushPDFTextFieldInfo(form.getTextField(name), info);
      }
    });
    return info;
  }

  pushPDFTextFieldInfo(field: PDFTextField, info: FieldInfo[]) {
    info.push({
      name: field.getName(),
      type: field.constructor.name,
      value: field.getText(),
      field: field,
      update: (newValue: string) => {
        field.setText(newValue);
      },
    });
  }

  async appendModifiedPages(pages: number[]) {
    const [importedPage] = await this.outputPdf.copyPages(
      this.templatePdf,
      pages,
    );
    this.outputPdf.addPage(importedPage);
  }

  addPage(page: number, mods: PageModification[]) {
    this.modifications.push({
      page,
      mods,
    });
    return this;
  }

  async modifyPdf() {
    this.fields = await this.readFieldNames();
    for (const modification of this.modifications) {
      modification.mods.forEach((mod) => {
        mod({
          fields: this.fields,
        });
      });
      await this.templatePdf.save();
      await this.appendModifiedPages([0]);
    }
  }

  static modifyField(name: string, value: string | string[]): PageModification {
    return (page: IModifyPage) => {
      const modField = page.fields.find((field) => field.name === name);
      if (modField) {
        if (Array.isArray(value)) {
          value = value.join(`\n`);
        }
        modField.update(value);
      }
    };
  }

  static dumpFields(): PageModification {
    return (page: IModifyPage) => {
      console.dir(
        page.fields.map((field) => {
          return {
            name: field.name,
            value: field.value,
          };
        }),
        { depth: 10 },
      );
    };
  }

  async writeOutput(filename: string) {
    const pdfBytes = await this.outputPdf.save({ useObjectStreams: false });
    fs.writeFileSync(filename, pdfBytes);
  }
}
