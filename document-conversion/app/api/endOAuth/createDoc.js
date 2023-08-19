import { convertMarkdownToHtml } from "./../../../utils/markdownToHtml";
import { JSDOM } from "jsdom";

export async function exportToGDoc(markdownString, title = "Document", docs) {
  const htmlString = convertMarkdownToHtml(markdownString);
  const { window } = new JSDOM(htmlString);
  const document = window.document;

  const bodyElements = Array.from(document.body.children);

  const doc = await docs.documents.create({ requestBody: { title } });
  const documentId = doc.data.documentId;

  let parsedContent = [];

  let requests = [];
  let currentIndex = 1;

  bodyElements.forEach((node) => {
    let textContent = node.textContent + "\n";
    let endIndexOfContent = currentIndex + textContent.length;

    // Step 1: Insert text
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: textContent,
      },
    });

    // Step 2: Apply formatting based on the tag
    switch (node.nodeName.toLowerCase()) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        const headingLevel = parseInt(node.nodeName[1]);
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            paragraphStyle: {
              namedStyleType: `HEADING_${headingLevel}`,
            },
            fields: "namedStyleType",
          },
        });
        break;

      case "pre":
      case "code":
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            paragraphStyle: {
              namedStyleType: "NORMAL_TEXT",
            },
            fields: "namedStyleType",
          },
        });

        // Monospace font
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            textStyle: {
              weightedFontFamily: {
                fontFamily: "Courier New",
                weight: 400,
              },
            },
            fields: "weightedFontFamily",
          },
        });

        // Block quote
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            paragraphStyle: {
              indentStart: {
                magnitude: 36,
                unit: "PT",
              },
            },
            fields: "indentStart",
          },
        });
        break;

      case "blockquote":
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            paragraphStyle: {
              namedStyleType: "NORMAL_TEXT",
            },
            fields: "namedStyleType",
          },
        });

        // Italic
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            textStyle: {
              italic: true,
            },
            fields: "italic",
          },
        });

        // Indentation
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            paragraphStyle: {
              indentStart: {
                magnitude: 36,
                unit: "PT",
              },
            },
            fields: "indentStart",
          },
        });

        // Color
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: endIndexOfContent,
            },
            textStyle: {
              foregroundColor: {
                color: {
                  rgbColor: {
                    red: 0.2,
                    green: 0.2,
                    blue: 0.2,
                  },
                },
              },
            },
            fields: "foregroundColor",
          },
        });
        break;

      default:
        break;
    }

    currentIndex = endIndexOfContent;
  });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });

  return documentId;
}