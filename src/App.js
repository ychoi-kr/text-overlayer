import React, { useEffect, useRef, useState } from 'react';

function App() {
  const [ocr, setOcr] = useState('');
  const [editedText, setEditedText] = useState('');
  const [textColor, setTextColor] = useState('#000000'); // 글자색 기본값
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF'); // 배경색 기본값
  const [isDragging, setIsDragging] = useState(false);
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [fontSize, setFontSize] = useState(16); // Default font size
  const [overlays, setOverlays] = useState([]);

  const handleFileChange = (e) => {
    console.log("handleFileChange 호출됨");
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
        imageRef.current = img;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const redrawCanvasWithOverlays = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 클리어
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height); // 배경 이미지 다시 그리기
  
    overlays.forEach((overlay) => {
      // 배경색 설정 (선택적)
      if (overlay.backgroundColor !== 'transparent') {
        ctx.fillStyle = overlay.backgroundColor;
        ctx.fillRect(overlay.x, overlay.y, overlay.width, overlay.height);
      }
      // 텍스트 그리기
      ctx.font = `${overlay.fontSize}px Arial`;
      ctx.fillStyle = overlay.textColor;
      const lineHeight = overlay.fontSize * 1.2;
      wrapText(ctx, overlay.text, overlay.x, overlay.y + lineHeight, overlay.width, lineHeight);
    });
  };

  const applyTextOverlay = () => {
    console.log("applyTextOverlay 호출됨");
    console.log("적용 전 오버레이 상태:", overlays);
    const newOverlay = {
        text: editedText,
        x: rect.x,
        y: rect.y,
        fontSize,
        textColor,
    };
    setOverlays([...overlays, newOverlay]);
    redrawCanvasWithOverlays();

    console.log("적용 후 오버레이 상태:", overlays);
  };

  const handleMouseDown = (e) => {
    console.log("handleMouseDown 호출됨");
    if (!isImageLoaded) return;
  
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
  
    redrawCanvasWithOverlays();

    setIsDragging(true);
    setRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    console.log("handleMouseMove 호출됨");
    if (!isImageLoaded || !isDragging) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rectEnd = canvas.getBoundingClientRect();
    const width = e.clientX - rectEnd.left - rect.x;
    const height = e.clientY - rectEnd.top - rect.y;

    setRect({ ...rect, width, height });

    // 임시 사각형 그리기
    redrawCanvasWithOverlays(); // 기존 오버레이 다시 그리기
    ctx.strokeStyle = 'red'; // 사각형 테두리 색상 설정
    ctx.strokeRect(rect.x, rect.y, width, height); // 실시간 사각형 그리기
  };

  const handleMouseUp = (e) => {
    console.log("handleMouseUp 호출됨");
    setIsDragging(false);
    if (!isImageLoaded) return;
  };

  function drawOverlays() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    overlays.forEach(overlay => {
      ctx.font = `${overlay.fontSize}px Arial`;
      ctx.fillStyle = overlay.textColor;
      // Use your existing text wrapping logic if necessary
      ctx.fillText(overlay.text, overlay.x, overlay.y);
    });
  }

  const applyOverlay = () => {
    const newOverlay = { text: editedText, x: rect.x, y: rect.y, fontSize, textColor };
    setOverlays([...overlays, newOverlay]);
    drawOverlays(); // Ensure this also clears the previous selection rectangle
  };

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let testWidth = 0;
  
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      testWidth = context.measureText(testLine).width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y); // Draw the last line
  }
  
  // indicate if the background is transparent
  const [isBackgroundTransparent, setIsBackgroundTransparent] = useState(false);
  
  // Function to handle setting the background to transparent
  const makeBackgroundTransparent = () => {
    setIsBackgroundTransparent(true);
    setBackgroundColor('transparent'); // Use 'transparent' as a placeholder
  };

  const handleOverlayText = () => {
    console.log("handleOverlayText 호출됨");
    const newOverlay = {
      text: editedText,
      x: rect.x,
      y: rect.y,
      width: rect.width, // 필요한 경우 width와 height도 저장
      height: Math.max(20, rect.height),
      fontSize: fontSize,
      textColor: textColor,
      backgroundColor: isBackgroundTransparent ? 'transparent' : backgroundColor,
    };

    // 오버레이 상태 업데이트
    setOverlays(prevOverlays => [...prevOverlays, newOverlay]);
  };

  useEffect(() => {
    if (isImageLoaded) {
      redrawCanvasWithOverlays();
    }
  }, [overlays]); // overlays 상태가 변경될 때마다 실행

  const redrawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const link = document.createElement('a');
    link.download = 'overlay-image.png';
    link.href = image;
    link.click();
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
      <div>
        <textarea
          rows="3"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Edit Text Here"
        />
        <div>
          <label>Font Size: </label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            min="1" // Prevents font size from being less than 1
          />
        </div>
        <div>
          <label>Text Color: </label>
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          <label>Background Color: </label>
          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
          <button onClick={makeBackgroundTransparent}>Make Background Transparent</button>
        </div>
        <button onClick={handleOverlayText}>Overlay Text</button>
        <button onClick={handleDownloadImage}>Download Image</button>
      </div>
    </div>
  );
}

export default App;
