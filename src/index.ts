import fs from 'fs';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import {
  AutomizerSummary,
  FieldInfo,
  IModifyPage,
  PageModification,
  PDFAutomizerParams,
} from './types';

export default class PDFAutomizer {
  templatePdf: PDFDocument | undefined;
  outputPdf: PDFDocument | undefined;
  modifications: {
    page: number;
    mods: PageModification[];
  }[] = [];
  fields: FieldInfo[] = [];
  params: PDFAutomizerParams = {};

  constructor(params: PDFAutomizerParams) {
    this.params = params;
  }

  loadTemplates(templatePdf: PDFDocument, outputPdf?: PDFDocument) {
    this.templatePdf = templatePdf;
    this.outputPdf = outputPdf;
  }

  async loadPdf(filename: string) {
    const existingPdfBytes = fs.readFileSync(
      this.params.templateDir + '/' + filename,
    );
    return PDFDocument.load(existingPdfBytes);
  }

  static async createPdf() {
    return PDFDocument.create();
  }

  getTemplatePdf(): PDFDocument {
    if (!this.templatePdf) {
      throw new Error('Template not loaded');
    }

    return this.templatePdf;
  }

  getOutputPdf(): PDFDocument {
    if (!this.outputPdf) {
      throw new Error('Output not loaded');
    }
    return this.outputPdf;
  }

  async readFieldNames() {
    const form = this.getTemplatePdf().getForm();
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
    const [importedPage] = await this.getOutputPdf().copyPages(
      this.getTemplatePdf(),
      pages,
    );
    this.getOutputPdf().addPage(importedPage);
  }

  async addSlide(template: string, page: number, mods: PageModification[]) {}

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
      await this.getTemplatePdf().save();
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

  async writeOutput(filename: string): Promise<AutomizerSummary> {
    if (!this.outputPdf) {
      throw new Error('no output initialized');
    }
    const pdfBytes = await this.outputPdf.save({ useObjectStreams: false });
    fs.writeFileSync(this.params.outputDir + '/' + filename, pdfBytes);

    return {
      status: 'finished',
      duration: 1,
      file: this.params.outputDir + '/' + filename,
      filename: filename,
      templates: 1,
      slides: 1,
      charts: 0,
      images: 0,
      masters: 0,
    };
  }
}
