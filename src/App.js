import './App.css';

function App() {
  
  return (  
    <div id="Eyp" className="App App-header crt">
      <div className="visible">
      <div className="topbar">
        <img src="/flag-orpheus-left.svg" alt="HackClub logo" className="logo" />
        <div className="navbar">  
          <a className="navi" href="https://makerprint.fillout.com/rsvp" target="_blank" rel="noopener noreferrer">[R] RSVP</a>
          <a className="navi" href="https://hackclub.enterprise.slack.com/archives/C0AGB5HP066" target="_blank" rel="noopener noreferrer">[S] Slack</a>
          <a className="navi" href="https://github.com/vasipallie/makercreate" target="_blank" rel="noopener noreferrer">[G] GitHub</a>
          <a className="navi" href="/console">[C] Console (WIP)</a>
        </div>
      </div>
      <h1>MakerCreate.</h1>
      <subtitle>A <label title="You Ship, We (will) Ship">YSWS</label> Program @ HackClub</subtitle>
      <hr></hr>
      <div className="modelholder">
        <div className="vmodels">
          <div className="vtitle"><span>PROJECT 1</span> <span className="vmodel-x">X</span></div>
          <div className="Viewer">
            <iframe title="MiG-21" src="https://hackclub.com" frameBorder="0" allowFullScreen mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
            
          </div>
        </div>

        <div className="vmodels">
          <div className="vtitle"><span>PROJECT 2</span> <span className="vmodel-x">X</span></div>
          <div className="Viewer">
            <iframe title="MiG-21" src="https://hackclub.com" frameBorder="0" allowFullScreen mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
            
          </div>
        </div>

        <div className="vmodels">
          <div className="vtitle"><span>PROJECT 3</span> <span className="vmodel-x">X</span></div>
          <div className="Viewer">
            <iframe title="MiG-21" src="https://hackclub.com" frameBorder="0" allowFullScreen mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
            
          </div>
        </div>
      </div>
      <hr></hr>
      <h2>What is MakerCreate?</h2>
      <p>MakerCreate is a YSWS (You Ship, We Ship) program @ HackClub. You spend time designing CAD projects on an editor of your choice, and we ship you a 3D printer of your choice!</p>
      <div className="ruleholder">
      <div className="rules">
        <h2>Rules and Guidelines of MakerCreate.</h2>
        <span>Eligibility Criteria:</span>
        <ul>
          <li>You MUST be 13-18 years old.</li>
          <li>You CANNOT be banned from Hackatime.</li>
          <li>You MUST be part of HackClub Slack.</li>
          <li>Your identity MUST be verified via <a href="https://auth.hackclub.com" target="_blank" rel="noopener noreferrer">HackClub Auth</a></li>
        </ul>

        <span className="rules">Project Guidelines:</span>
        <ul>
          <li>You MUST spend atleast 1 hour on your project.</li>
          <li>You MUST use one of our approved CAD software.</li>
          <li>You MUST use our lapse-based journaling system.</li>
          <li>Upload your project files to printables.</li>
        </ul>
      </div>
      </div>
      </div>

      <div className="crtvideo">
        <div className="Holding">

          <div className="boottext">
            <div>
              <img src="orpheus.png" alt="Orpheus" className="orpheus" width="100vw" />
            </div>
            <div className="boottext-title">
              <p className="orpheus-title">Orpheus Inc.</p>
              <p className="orpheus-title">HackClub Systems</p>
            </div>
          </div>

          <div className="estarimg">
            <img src="/energystar.png"  className="estar" />
          </div>

        </div>
      </div>

    </div>
  );
}

export default App;
