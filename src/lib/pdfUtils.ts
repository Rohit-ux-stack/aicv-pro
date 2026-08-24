import * as pdfjsLib from 'pdfjs-dist';

// Setup worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const convertPdfAllPagesToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const numPages = pdf.numPages; // PDF mein kitne pages hain
  const imagesArray: string[] = [];
  
  // Har page ke through loop karenge
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Scale 1.5 rakha hai taki quality acchi rahe par size limit cross na kare
    const viewport = page.getViewport({ scale: 1.5 }); 
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error("Canvas context missing");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    // Quality 0.8 (80%) rakhi hai taki Next.js API me payload size error (413) na aaye
    imagesArray.push(canvas.toDataURL('image/jpeg', 0.8)); 
  }
  
  return imagesArray; // Return array of base64 images
};
