import './App.css';

function App() {
  
  return (
    <div id="Eyp" className="App App-header crt">
      <div className="topbar">
        <img src="/flag-orpheus-left.svg" alt="HackClub logo" className="logo" />
        <div className="navbar">  
          <a href="https://makerprint.fillout.com/rsvp" target="_blank" rel="noopener noreferrer">[R] RSVP</a>
          <a href="https://hackclub.enterprise.slack.com/archives/C0AGB5HP066" target="_blank" rel="noopener noreferrer">[S] Slack</a>
          <a href="https://github.com/vasipallie/makercreate" target="_blank" rel="noopener noreferrer">[G] GitHub</a>
          <a href="/console">[C] Console (WIP)</a>
        </div>
      </div>
      <h1>MakerCreate.</h1>
      <subtitle>A <label title="You Ship, We (will) Ship">YSWS</label> Program @ HackClub</subtitle>
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
    </div>
  );
}

export default App;
