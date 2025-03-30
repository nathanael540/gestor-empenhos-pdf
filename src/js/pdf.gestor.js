export class PdfGestorEmpenhos {
  pdfHandle = null; // Handle do arquivo PDF
  pdfFile = null; // Arquivo PDF ja aberto no pdfjsLib
  capasEmpenhos = []; // {page: number, content: string, empenho: number, credor: string, parcela: number}

  async setup(pdfHandle) {
    this.pdfHandle = pdfHandle;

    const pdfUint8Array = await pdfHandle.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: pdfUint8Array }).promise;
    this.pdfFile = pdf;

    await this._processCapasEmpenhos();

    return this.capasEmpenhos.length;
  }

  async renderEmpenhoPDF(empenho) {
    const pages = this.getEmpenhoPageRange(empenho.page);
    if (!pages) {
      return null;
    }

    console.log("Renderizando PDF do empenho: ", empenho.empenho);

    try {
      const indices = [];
      for (let i = pages.begin; i <= pages.end; i++) {
        indices.push(i - 1);
      }

      const pdfDoc = await PDFLib.PDFDocument.load(
        await this.pdfHandle.arrayBuffer()
      );
      const newPdfDoc = await PDFLib.PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, indices);

      copiedPages.forEach((page) => {
        newPdfDoc.addPage(page);
      });

      const newPdfBytes = await newPdfDoc.save();

      return new Blob([newPdfBytes], {
        type: "application/pdf",
        name: `${empenho.empenho} - ${empenho.parcela}.pdf`,
      });
    } catch (error) {
      console.error("Erro ao renderizar o PDF: ", error);
      return null;
    }
  }

  async getEmpenhos(numberEmpenho) {
    const empenhos = this.capasEmpenhos.filter((capa) => {
      return capa.empenho === numberEmpenho;
    });

    if (empenhos.length === 0) {
      console.error("Empenho não encontrado: ", numberEmpenho);
      return null;
    }

    console.log(
      "Busccando empenho: ",
      numberEmpenho,
      "=> Encontrados",
      empenhos.length
    );

    return empenhos;
  }

  getEmpenhoPageRange(beginEmpenho) {
    const indexStart = this.capasEmpenhos.findIndex((capa) => {
      return capa.page === beginEmpenho;
    });
    const endEmpenho =
      this.capasEmpenhos[indexStart + 1]?.page - 1 || this.pdfFile.numPages;
    if (indexStart === -1) {
      console.error("Empenho não encontrado: ", beginEmpenho);
      return null;
    }

    console.log(
      "O empenho começa na página: ",
      beginEmpenho,
      " e termina na página: ",
      endEmpenho
    );

    return {
      begin: beginEmpenho,
      end: endEmpenho,
    };
  }

  async _processCapasEmpenhos() {
    const numPages = this.pdfFile.numPages;
    let pageNum = 1;

    console.log("Processando capas de empenhos no PDF:", this.pdfHandle.name);

    while (pageNum <= numPages) {
      const page = await this.pdfFile.getPage(pageNum);
      const textContent = await page.getTextContent();
      let extractedText = textContent.items.map((item) => item.str).join(" ");
      extractedText = extractedText.toLowerCase();
      extractedText = extractedText.replace(/\s+/g, " ");

      if (
        extractedText.includes("empenho") &&
        extractedText.includes("parcela") &&
        extractedText.includes("credor")
      ) {
        let credor = null;
        let empenho = null;
        let parcela = null;

        const empenhoMatch = extractedText.match(/empenho\s*:\s*(\d+)/);
        if (empenhoMatch) {
          empenho = empenhoMatch[1];
        }
        const parcelaMatch = extractedText.match(/parcela\s*:\s*(\d+)/);
        if (parcelaMatch) {
          parcela = parcelaMatch[1];
        }

        const capa = {
          page: pageNum,
          content: extractedText,
          empenho: empenho,
          parcela: parcela,
          credor: credor,
        };

        this.capasEmpenhos.push(capa);
      }

      pageNum++;
    }
  }
}
