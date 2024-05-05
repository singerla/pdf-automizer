import { PDFTextField } from 'pdf-lib';

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
export type TemplateInfo = {
  name: string;
  slides: SlideInfo[];
};

export type SlideInfo = {
  id: number;
  number: number;
  info: TemplateSlideInfo;
  elements: ElementInfo[];
};

export type TemplateSlideInfo = {
  name: string;
};

export type ElementType = 'PDFTextField';

export type ElementInfo = {
  name: string;
  type: ElementType;
  id: string;
  position: {
    x: number;
    y: number;
    cx: number;
    cy: number;
  };
  hasTextBody: boolean;
};

export type PageModification = (page: IModifyPage) => void;
export type ShapeModificationCallback = (element: any, relation?: any) => void;

export type PDFAutomizerParams = {
  templateDir?: string;
  outputDir?: string;
};
export type AutomizerSummary = {
  status: string;
  duration: number;
  file: string;
  filename: string;
  templates: number;
  slides: number;
  charts: number;
  images: number;
  masters: number;
};
