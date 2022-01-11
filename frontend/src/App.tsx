import React, { useEffect, useState } from 'react';
import './App.css';
import axios from "axios";
import { Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [allPhotos, setAllPhotos] = useState([]);
  const baseUri = process.env.REACT_APP_API_URL!;

  async function fetchPhotos(baseUri: string) {
    const results = await axios.get(`${baseUri}getAllPhotos`);
    results.data.message.forEach((m: any) => console.log(m.url));
    setAllPhotos(results.data.message);
  }

  useEffect(() => {
    fetchPhotos(baseUri);
  }, []);

  function getCarouselImage(photo: any) {
    return (<Carousel.Item interval={1000} style={{ height: 350 }}>
      <img className="h-100" src={photo.url} alt={photo.filename} />
      <Carousel.Caption>
        <h3 style={{ backgroundColor: 'rgba(0,0,0,.3)' }}>{photo.filename}</h3>
      </Carousel.Caption>
    </Carousel.Item>
    );
  }

  return (
    <div className="App bg-secondary min-vh-100">
      <h1>Super Mario &amp; Friends</h1>
      <Carousel>
        {allPhotos.map(photo => getCarouselImage(photo))}
      </Carousel>
    </div>
  );
}


export default App;
