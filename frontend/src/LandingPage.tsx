import React from "react";
import "./LandingPage.css";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="LandingPage">
      <header className="LandingPage-header">
        <h1 className="LandingPage-title" data-text="Random Box">
          Random Box
        </h1>
        <p>Public random loot generation infrastructure.</p>
        <p>
          <code className="LandingPage-code">
            rinkeby = {process.env.REACT_APP_RB_ADDRESS}
          </code>
        </p>
        <div className="LandingPage-spacer" />
        <p>
          <div>
            <Link to="/app" className="LandingPage-button">
              Launch App
            </Link>
          </div>
        </p>
        <br />
        <div className="LandingPage-large-spacer" />
        <p>
          <a
            className="LandingPage-link"
            href="/docs/#/contracts/RandomBox.sol:RandomBox"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </p>
      </header>
    </div>
  );
}

export default LandingPage;
