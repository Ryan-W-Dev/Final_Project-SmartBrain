import React from 'react';
import './FaceRecognition.css';

const FaceRecognition = ({ boxes, imageUrl, onImageLoad }) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="face-recognition">
      <img
        alt="Submitted for detection"
        className="input-image"
        id="inputimage"
        onLoad={onImageLoad}
        src={imageUrl}
      />
      {boxes.map((box, i) => {
        return (
          <div
            key={i}
            className="bounding-box"
            style={{
              top: box.topRow,
              right: box.rightCol,
              bottom: box.bottomRow,
              left: box.leftCol,
            }}
          ></div>
        );
      })}
    </div>
  );
};

export default FaceRecognition;
