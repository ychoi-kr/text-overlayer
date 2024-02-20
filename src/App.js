import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

function App() {
  const [ocr, setOcr] = useState('');
  const [editedText, setEditedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setIsImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        setIsImageLoaded(true);
      };
      img.src = e.target.result;
      imageRef.current = img;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    if (!isImageLoaded) return;
    const canvas = canvasRef.current;
    const rectStart = canvas.getBoundingClientRect();
    setRect({
      x: e.clientX - rectStart.left,
      y: e.clientY - rectStart.top,
      width: 0,
      height: 0,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isImageLoaded || !isDragging) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rectEnd = canvas.getBoundingClientRect();
    const width = e.clientX - rectEnd.left - rect.x;
    const height = e.clientY - rectEnd.top - rect.y;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.strokeRect(rect.x, rect.y, width, height);
    setRect({ ...rect, width, height });
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    if (!isImageLoaded) return;
    // OCR and other operations are assumed to be triggered here if needed
  };

  const handleOverlayText = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawImage(); // Ensure the latest image is displayed without previous rectangles/texts
    ctx.font = "16px Arial";
    ctx.fillStyle = "black"; // Choose a color that stands out
    ctx.fillText(editedText, rect.x, rect.y + 16, rect.width); // Adjust text position if necessary
  };

  const redrawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {isImageLoaded && <div>Drag to select the area for OCR.</div>}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={() => setIsDragging(false)} // Optional: Stop dragging if the mouse leaves the canvas
        style={{ border: "1px solid black" }} // Optional: Makes the canvas boundary visible
      />
      <textarea
        rows="3"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        placeholder="Edit Text Here"
      />
      <button onClick={handleOverlayText}>Overlay Text</button>
    </div>
  );
}

export default App;
