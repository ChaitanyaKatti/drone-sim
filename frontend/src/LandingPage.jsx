import React from 'react';
import { Link } from 'react-router-dom';
import Container from "react-bootstrap/Container";

const LandingPage = () => {
  return (

    <Container as="main" className="text">
      <h1 className="display-1 text">Drone-Sim</h1>
      <p className="lead">Optimization of drone flight path using python torch backend</p>
      <h2>Choose a scene:</h2>
      <ul>
        <li>
          <Link to="/Scene1">Scene 1</Link>
        </li>
      </ul>
    </Container>
    
  );
};

export default LandingPage;
