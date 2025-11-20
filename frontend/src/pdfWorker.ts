// Configuração do worker do PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o caminho do worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default pdfjsLib;
