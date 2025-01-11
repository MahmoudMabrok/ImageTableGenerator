import { useState } from "react";
import { PlusCircle, Trash2, ImagePlus, Copy } from "lucide-react";

interface ImageData {
  url: string;
  title: string;
}

export default function MarkdownGenerator() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [columns, setColumns] = useState<number>(2);
  const [markdownResult, setMarkdownResult] = useState<string>("");

  const addImage = () => {
    setImages([...images, { url: "", title: "" }]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (
    index: number,
    field: keyof ImageData,
    value: string
  ) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  // Validation function
  const isFormValid = () => {
    return (
      images.length > 0 && // At least one image is added
      images.every(
        (image) => image.url.trim() !== "" && image.title.trim() !== ""
      ) // All fields are filled
    );
  };

  const loadImagesFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      const regex = /!\[(.*?)\]\((.*?)\)/g;

      // Parse the markdown and extract title and URL
      const newImages: ImageData[] = [];
      let match;
      while ((match = regex.exec(clipboardText)) !== null) {
        const title = match[1]; // Captured group for the title
        const url = match[2]; // Captured group for the URL
        newImages.push({ title, url});
      }

      setImages((prev) => prev.concat(newImages));
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      alert(
        "Failed to read clipboard. Please ensure you have granted clipboard permissions."
      );
    }
  };

  const generateMarkdown = () => {
    if (!isFormValid()) return;

    const rows = Math.ceil(images.length / columns);
    let markdown = "";

    for (let row = 0; row < rows; row++) {
      // Calculate the number of images in this row
      const startIndex = row * columns;
      const endIndex = startIndex + columns;
      const rowImages = images.slice(startIndex, endIndex);

      // Generate the header row for this row
      markdown += "|";
      rowImages.forEach((image) => {
        markdown += ` ${image.title} |`;
      });
      // Add empty headers if there are fewer images than columns
      for (let i = rowImages.length; i < columns; i++) {
        markdown += " |";
      }
      markdown += "\n";

      // Generate the header alignment row for this row
      markdown += "|";
      rowImages.forEach(() => {
        markdown += ` --- |`;
      });
      // Add empty alignment cells if there are fewer images than columns
      for (let i = rowImages.length; i < columns; i++) {
        markdown += " --- |";
      }
      markdown += "\n";

      // Generate the image row for this row
      markdown += "|";
      rowImages.forEach((image) => {
        // Use plain markdown syntax for images
        markdown += ` ![${image.title}](${image.url}) |`;
      });
      // Add empty cells if there are fewer images than columns
      for (let i = rowImages.length; i < columns; i++) {
        markdown += " |";
      }
      markdown += "\n\n"; // Add an extra newline for spacing between rows
    }

    setMarkdownResult(markdown);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdownResult);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ImagePlus className="w-6 h-6" />
            Markdown Image Table Generator
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Columns
            </label>
            <input
              type="number"
              min="1"
              value={columns}
              onChange={(e) =>
                setColumns(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-24 px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={image.url}
                    onChange={(e) => updateImage(index, "url", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Image Title"
                    value={image.title}
                    onChange={(e) =>
                      updateImage(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={addImage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5" />
              Add Image
            </button>
            <button
              onClick={loadImagesFromClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Paste Images
            </button>
            <button
              onClick={generateMarkdown}
              disabled={!isFormValid()} // Disable the button if the form is invalid
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Markdown.
            </button>
          </div>
        </div>

        {markdownResult && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Markdown</h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
              {markdownResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
