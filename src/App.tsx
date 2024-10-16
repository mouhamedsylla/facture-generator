import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Book, FileText, Printer, Plus, Minus } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  price: number;
}

interface FormData {
  clientName: string;
  clientPhone: string;
  books: {
    bookId: string;
    quantity: number;
  }[];
}

const books: Book[] = [
  { id: "CI1", title: "CI: Cahier d'activités de transition arabe", price: 1100 },
  { id: "CI2", title: "CI: Cahier d'activités de lecture et de production d'écrit arabe", price: 1600 },
  { id: "CI3", title: "CI: Cahier d'activités d'écriture", price: 1100 },
  { id: "CP1", title: "CP: Cahier d'activités de révision arabe", price: 1100 },
  { id: "CP2", title: "CP: Cahier d'activités de lecture et de production d'écrit arabe", price: 1600 },
  { id: "CP3", title: "CP: Cahier d'activités d'écriture", price: 1100 },
  { id: "CE11", title: "CE1: Cahier d'activités de lecture, grammaire, conjugaison, orthographe, vocabulaire", price: 1600 },
  { id: "CE12", title: "CE1: Cahier d'activités de production d'écrit arabe", price: 1600 },
  { id: "CE21", title: "CE2: Cahier d'activités de lecture, grammaire, conjugaison, orthographe, vocabulaire", price: 1600 },
  { id: "CE22", title: "CE2: Cahier d'activités de production d'écrit arabe", price: 1600 },
  { id: "CM1", title: "CM1: Cahier d'activités de lecture, grammaire, conjugaison, orthographe, vocabulaire", price: 2000 },
];

function App() {
  const { register, control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      books: [{ bookId: "", quantity: 1 }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "books"
  });

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const watchBooks = watch("books");

  const calculateTotal = (bookItems: FormData['books']) => {
    return bookItems.reduce((total, item) => {
      const book = books.find(b => b.id === item.bookId);
      return total + (book?.price || 0) * item.quantity;
    }, 0);
  };

  const onSubmit = (data: FormData) => {
    const doc = new jsPDF();

    // Add logo
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoText = 'AS SHABIL';
    const logoFontSize = 8;

    doc.setFillColor(0, 102, 204);
    doc.circle(pageWidth / 2, 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(logoFontSize);
    const textWidth = doc.getTextWidth(logoText);
    doc.text(logoText, (pageWidth - textWidth) / 2, 24);

    // Add header
    doc.setTextColor(0, 102, 204);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const headerText = "FACTURE";
    const headerTextWidth = doc.getTextWidth(headerText);
    doc.text(headerText, (pageWidth - headerTextWidth) / 2, 40);
    //doc.text("برنامج تحسين جودة اللغة العربية والتربية الدينية في المدارس الفرنسية العربية", 10, 40)
    // doc.text("Programme d'amélioration de la qualité de l'apprentissage", 10, 40);
    // doc.text("de la langue arabe et l'éducation religieuse", 10, 48);
    // doc.text("dans les écoles franco-arabe", 10, 56);

    // Add client information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Client: ${data.clientName}`, 20, 70);
    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Date: ${today}`, 20, 78);

    // Prepare table data
    const tableData = data.books.map(item => {
      const book = books.find(b => b.id === item.bookId);
      const total = (book?.price || 0) * item.quantity;
      return [
        book?.title || "",
        item.quantity.toString(),
        `${book?.price.toFixed(0)} FCFA`,
        `${total.toFixed(0)} FCFA`
      ];
    });

    // Add table
    autoTable(doc, {
      startY: 85,
      head: [["Manuel", "Quantité", "Prix unitaire", "Total"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Calculate and add total
    const total = calculateTotal(data.books);

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 85;
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text(`Total: ${total.toFixed(0)} FCFA`, 150, finalY + 10);

    // Generate PDF
    const pdfOutput = doc.output('datauristring');
    setPdfUrl(pdfOutput);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-5 mb-8">
              <div className="bg-blue-600 rounded-full p-3">
                <Book className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                Générateur de Factures
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSubmit(onSubmit)} className="py-8 text-base leading-6 space-y-6 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nom de client</label>
                  <input
                    type="text"
                    {...register("clientName", { required: "Le nom du client est requis" })}
                    className="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                    placeholder="Nom du client"
                  />
                  {errors.clientName && <p className="text-red-500 text-xs italic">{errors.clientName.message}</p>}
                </div>
                {/* <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Téléphone du client</label>
                  <input
                    type="tel"
                    {...register("clientPhone", { required: "Le numéro de téléphone est requis" })}
                    className="px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                    placeholder="Numéro de téléphone"
                  />
                  {errors.clientPhone && <p className="text-red-500 text-xs italic">{errors.clientPhone.message}</p>}
                </div> */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">Manuels</label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-4">
                      <select
                        {...register(`books.${index}.bookId` as const, { required: "Veuillez sélectionner un manuel" })}
                        className="flex-grow px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                      >
                        <option value="">Sélectionnez un manuel</option>
                        {books.map((book) => (
                          <option key={book.id} value={book.id}>
                            {book.title} - {book.price} FCFA
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        {...register(`books.${index}.quantity` as const, { required: "La quantité est requise", min: 1 })}
                        className="w-20 px-4 py-2 border focus:ring-blue-500 focus:border-blue-500 block sm:text-sm border-gray-300 rounded-md shadow-sm"
                        placeholder="Qté"
                        min="1"
                      />
                      <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                        <Minus className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => append({ bookId: "", quantity: 1 })}
                    className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un manuel
                  </button>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Générer la facture
                  </button>
                </div>
              </form>
            </div>
            {pdfUrl && (
              <div className="mt-6">
                <a
                  href={pdfUrl}
                  download="facture.pdf"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Printer className="mr-2 h-5 w-5" />
                  Télécharger la facture PDF
                </a>
              </div>
            )}
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Total de la commande : {calculateTotal(watchBooks).toFixed(0)} FCFA</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
