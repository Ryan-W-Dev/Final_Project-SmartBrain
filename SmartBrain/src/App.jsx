import { useState } from 'react';
import './App.css';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="hero">
        <Navigation></Navigation>
        <Logo></Logo>
        {/* <ImageLinkForm></ImageLinkForm>
          <FaceRecognition></FaceRecognition> */}
      </div>
    </>
  );
}

export default App;
