import { FilesGestorEmpenhos } from "./files.gestor.js";
import { PdfGestorEmpenhos } from "./pdf.gestor.js";

export class GestorEmpenhos {
  static selectFilesId = "#select-files-btn";
  static inputValueSearchId = "#value-to-search";

  filesGestor = new FilesGestorEmpenhos();
  pdfGestor = new PdfGestorEmpenhos();

  seachValue = "";
  searchType = "empenho"; // empenho ou credor

  async setup() {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs";

    await this.filesGestor.setup();

    $(GestorEmpenhos.selectFilesId).click(this.processBtnClicked.bind(this));

    $(GestorEmpenhos.inputValueSearchId).on("input", (e) => {
      this.seachValue = e.target.value.trim();
      if (this.seachValue.length < 1) {
        this.seachValue = "";
      }
    });
  }

  async processBtnClicked() {
    const fileHandles = await this.filesGestor.selectFiles();
    if (!fileHandles) {
      return;
    }

    let pdfOne = await this.filesGestor.getOnePdf();
    if (!pdfOne) {
      console.error("Nenhum arquivo PDF encontrado para processamento.");
      return;
    }

    while (pdfOne) {
      //
      const pdfData = await this.pdfGestor.setup(pdfOne);
      if (!pdfData) {
        console.error(
          "Nenhum empenho no PDF! Verifique se o arquivo PDF está correto."
        );
        return;
      }

      let empenhosValores = this.seachValue.split("+");
      for (const empenhoValor of empenhosValores) {
        const empenhos = await this.pdfGestor.getEmpenhos(empenhoValor.trim());
        if (!empenhos) {
          console.error(
            "Nenhum empenho encontrado! Verifique se o empenho existe."
          );
          return;
        }

        for (const empenho of empenhos) {
          const empenhoPDF = await this.pdfGestor.renderEmpenhoPDF(empenho);
          if (!empenhoPDF) {
            console.error(
              "Nenhum empenho encontrado! Verifique se o empenho existe."
            );
            return;
          }

          const saved = await this.filesGestor.saveEmpenhoPDF(
            empenho,
            empenhoPDF
          );
          if (!saved) {
            console.error("Erro ao salvar o arquivo PDF.");
            return;
          }
        }
      }

      // Verifica se há mais arquivos PDF para processar
      if (this.filesGestor.hasMoreFiles()) {
        pdfOne = await this.filesGestor.getOnePdf();
      } else {
        pdfOne = null;
      }
    }

    alert("Arquivos PDF salvos com sucesso!");
  }
}
