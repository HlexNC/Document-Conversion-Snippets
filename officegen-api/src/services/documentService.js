const officegenHelper = require('../utils/officegenHelper');

// Service to handle document creation with structured elements
exports.createDocumentWithStructure = async (elements, styles) => {
  try {
    const timestamp = new Date().getTime();
    const outputPath = `styled_document_${timestamp}.docx`;
    const resultPath = await officegenHelper.createDocxWithStructureAndStyle(elements, styles, outputPath);
    return resultPath;
  } catch (error) {
    console.error('Error creating styled document:', error);
    throw error;
  }
};
