import PDFAutomizer from './index';

type DataRecord = {
  fields: Record<string, string | string[]>;
  page: number;
  copy: number;
};

const data: DataRecord[] = [
  {
    fields: {
      FieldKey1: ['Test 123'],
      FieldKey2: 'D-09-011-G-0211-0002',
      Date: '03.02.2023',
    },
    page: 0,
    copy: 4,
  },
  {
    fields: {
      Sender: ['Test', 'Adresse 2'],
      FieldKey2: 'D-09-011-G-0211-0002',
      Date: '03.02.2023',
    },
    page: 0,
    copy: 4,
  },
];

const templateDir = `${__dirname}/../__tests__/pdf-templates/`;
const outputDir = `${__dirname}/../__tests__/pdf-output/`;
const filename = 'YOUR_FILE.pdf';

const run = async () => {
  const automizer = new PDFAutomizer(
    await PDFAutomizer.loadPdf(templateDir + filename),
    await PDFAutomizer.createPdf(),
  );

  // enamble this to show current fields in template pdf
  // automizer.addPage(0, [PDFAutomizer.dumpFields()]);

  for (const makePages of data) {
    const mods = [];
    for (const field in makePages.fields) {
      mods.push(PDFAutomizer.modifyField(field, makePages.fields[field]));
    }

    for (let i = 0; i <= makePages.copy; i++) {
      automizer.addPage(makePages.page, mods);
    }
  }

  await automizer.modifyPdf();
  await automizer.writeOutput(outputDir + filename);
};

run().then(() => {
  console.info('Finished PDF: ' + filename);
});
