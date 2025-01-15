import { useState } from "react";
import { PlusCircle, Trash2, ImagePlus, Copy } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DOMPurify from "dompurify"; // For sanitizing HTML

interface ImageData {
  url: string;
  title: string;
}

export default function TableGenerator() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [columns, setColumns] = useState<number>(2);
  const [htmlResult, setHtmlResult] = useState<string>("");

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

      // github sometimes use []() annotation and other uses <img> when upload files, so we
      // need to handle both cases.
      const regex = /!\[(.*?)\]\((.*?)\)|<img[^>]+alt="(.*?)"[^>]+src="(.*?)"/g;

      // Parse the markdown and extract title and URL
      const newImages: ImageData[] = [];
      let match;
      while ((match = regex.exec(clipboardText)) !== null) {
        if (match[1] && match[2]) {
          newImages.push({ title: match[1], url: match[2] });
        } else if (match[3] && match[4])
          newImages.push({ title: match[3], url: match[4] });
      }

      if (newImages.length > 0) {
        setImages((prev) => prev.concat(newImages));
      } else {
        alert(
          "No images data existing in pasted data, we support ![]() and <img alt src>"
        );
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      alert(
        "Failed to read clipboard. Please ensure you have granted clipboard permissions."
      );
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return; // Dropped outside the list

    const reorderedImages = Array.from(images);
    const [removed] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, removed);
    setImages(reorderedImages);
  };

  const generateHtmlTable = () => {
    if (!isFormValid()) return;

    const rows = Math.ceil(images.length / columns);
    const columnWidth = 100 / columns;

    let html = `<table style="width: 100%; border-collapse: collapse;">`;

    for (let row = 0; row < rows; row++) {
      const startIndex = row * columns;
      const endIndex = startIndex + columns;
      const rowImages = images.slice(startIndex, endIndex);

      // Header row
      html += `<tr>`;
      rowImages.forEach((image) => {
        html += `<th style="width: ${columnWidth}%; text-align: center; border: 1px solid #ccc; padding: 8px;">${image.title}</th>`;
      });
      for (let i = rowImages.length; i < columns; i++) {
        html += `<th style="width: ${columnWidth}%; text-align: center; border: 1px solid #ccc; padding: 8px;"></th>`;
      }
      html += `</tr>`;

      // Image row
      html += `<tr>`;
      rowImages.forEach((image) => {
        html += `<td style="width: ${columnWidth}%; text-align: center; border: 1px solid #ccc; padding: 8px;"><img src="${image.url}" alt="${image.title}" style="max-width: 100%; height: auto;" /></td>`;
      });
      for (let i = rowImages.length; i < columns; i++) {
        html += `<td style="width: ${columnWidth}%; text-align: center; border: 1px solid #ccc; padding: 8px;"></td>`;
      }
      html += `</tr>`;
    }

    html += `</table>`;

    // Sanitize the HTML before setting it
    setHtmlResult(DOMPurify.sanitize(html));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlResult);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ImagePlus className="w-6 h-6" />
            Image Table Generator
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
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="image-list">
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ listStyle: "none", padding: 0 }}
                  >
                    {images.map((image, index) => (
                      <Draggable
                        key={index}
                        draggableId={`image-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              padding: "8px",
                              margin: "8px 0",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              backgroundColor: "#f9f9f9",
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div key={index} className="flex gap-4 items-start">
                              <div className="flex-1">
                                <input
                                  type="url"
                                  placeholder="Image URL"
                                  value={image.url}
                                  onChange={(e) =>
                                    updateImage(index, "url", e.target.value)
                                  }
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
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
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
              onClick={generateHtmlTable}
              disabled={!isFormValid()} // Disable the button if the form is invalid
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate.
            </button>
          </div>
        </div>

        {htmlResult && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated HTML Table</h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlResult) }}
              style={{
                marginTop: "20px",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
