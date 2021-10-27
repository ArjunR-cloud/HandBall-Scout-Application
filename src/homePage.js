import React from "react";
import {getMatchInstanceObject} from './utilFunctions/util.js';
import Axios from "axios";
import skySportsLogo from "./assets/images/skySportsLogo.png";
import playIcon from "./assets/images/play.png";
import pauseIcon from "./assets/images/pause.png";
import scoreUp from "./assets/images/scoreUp.png";
import scoreDown from "./assets/images/scoreDown.png";

var matchId;

//home control variables
var homeScore = 0;
var homeEmptyGoal = 0;
var homeTimeout = 0;

//away control variables
var awayScore = 0;
var awayEmptyGoal = 0;
var awayTimeout = 0;

//timer variables
var tminutes = 0;
var tseconds = 0;
//var tmilliseconds = 0;  //removing milliseconds as milliseconds driven clock can be efficiently handled only on server code
var intervalId;
var timerRunning = 0;

//penalty value initializers
window.hp1Obj = {type: 1, seconds: 120, limit: 0, running: 0, active: 0, direction: -1};
window.hp2Obj = {type: 2, seconds: 120, limit: 0, running: 0, active: 0, direction: -1};
window.hp3Obj = {type: 3, seconds: 120, limit: 0, running: 0, active: 0, direction: -1};
window.ap1Obj = {type: 4, seconds: 120, limit: 0, running: 0, active: 0, direction: -1};
window.ap2Obj = {type: 5, seconds: 120, limit: 0, running: 0, active: 0, direction: -1};
window.ap3Obj = {type: 6, seconds: 120, limit: 0, running: 0, active: 0, direction: -1};

class MatchIdPanel extends React.Component {
    constructor(props){
        super(props);
        this.state = {matchIdVerified:false};
        this.verifyMatchId = this.verifyMatchId.bind(this);
    }
    verifyMatchId(e){
        //just basic number and length validation due to preceding 0 error from api
        const input =  Number(document.getElementById("inMatchId").value);
        const inputLength = input.toString().length;
        if(Number(input) && (inputLength > 5 && inputLength < 9)){
            matchId = Number(input);
            this.setState({matchIdVerified:true});
            //start scouting
            window.setInterval(function(){ PostMatchInstance();}, 2000);
        }else{
            alert("Please enter a valid Match ID");
        }
    }
    render(){
        return (
            <div id="wrapper">
                <img id="skySportsLogo" src={skySportsLogo}/>
            {!this.state.matchIdVerified ? 
                <div id="matchIdPanel">
                    <div style={{margin:"auto",width:"50%",marginTop:"15%",textAlign:"center"}}>
                        <label htmlFor="inMatchId"><h1 style={{textShadow:"0 0 10px #0b0b0b, 0 0 10px #0f0e0e"}}>Please Enter Match ID</h1></label>
                        <input type="number" id="inMatchId" autoFocus={true} placeholder="Enter your date of birth..." maxLength="8" style={{height:"30px"}}/><br/>
                        <button id="startButton" onClick={this.verifyMatchId.bind(this)}>START SCOUTING</button>
                    </div>
                </div>
                :
                ScoutPanel()
            }
            </div>
        )
    }
}
export default MatchIdPanel;


function PostMatchInstance(){
    let totalSeconds = (tminutes * 60) + tseconds;
    let limit;
    if(tseconds == 0 && !timerRunning && ([30,60,75,90].indexOf(tminutes) > -1)){ limit = totalSeconds; }
    else{ 
        limit = ([30,60,75,90].find(function(it){return (tminutes%it)==tminutes;})) * 60;
    }
    const time = {type:"main",totalSeconds,limit,timerRunning,timerActive:1, timerDirection:1};
    const penalties = [hp1Obj, hp2Obj, hp3Obj, ap1Obj, ap2Obj, ap3Obj];
    const score = {type:"score",homeScore,awayScore};
    const teamTimeout = {homeTimeout, awayTimeout};
    const emptyGoal = {homeEmptyGoal, awayEmptyGoal};
    const objMatchInstance = getMatchInstanceObject(matchId, time, penalties, score, teamTimeout, emptyGoal);
    //console.log(JSON.stringify(objMatchInstance));
    const options = {
        method: 'POST',
        mode: "cors",
        headers: { "Access-Control-Allow-Origin": "*" , 'Authorization':'Basic ' + Buffer.from("skyAssignment" + ":" + "p0wer_overWhelm1ng",'utf8').toString('base64'),'content-type': 'application/json'},
        data: JSON.stringify(objMatchInstance),
        url: "/hblclock"
    };
    Axios(options).then(function (response) {
        //handle success
        //console.log(response);
        const status = response.data.status;
        if(status != 10) { 
            if(status == 11){ 
                console.log("Server time out. No data, or corrupted data");
                console.log(response);
            }else if(status >= 100){
                let mainCodeArr = ["data", "matchId", "mainClock", "score", "penalties", "emptyGoal", "teamTimeout"];
                console.log(mainCodeArr[(status/100)-1] + "key is missing");
                console.log(response);
            }else{
                let secondaryCodeArr = ["type","seconds","running","active","direction","limit","scoreHome","scoreAway"];
                console.log(secondaryCodeArr[status-1] + "key is missing or wrong value type");
                console.log(response);
            }
        }
    })
    .catch(function (error) {
        //handle error
        console.log("Error: " + error);
    })
    .then(function () {
        //always executed
        //ignoring for now
    });
}

const ScoutPanel = () => {
    return (
        <div>
            <div className="matchIdHeader">
                <span style={{textShadow:"0 0 10px #0b0b0b, 0 0 10px #0f0e0e"}}>MATCH ID: {matchId}</span>
            </div>
            <div>
                <HomePenaltyClocks/>
            </div>
            <div style={{margin:"auto",width:"50%",marginTop:"8%"}}>
                <div style={{marginLeft:"10%"}}>
                    <HomeScorePanel/>
                    <TimerPanel/>
                    <AwayScorePanel/>
                </div>
                <div style={{marginTop:"2%",textShadow:"0 0 10px #0b0b0b, 0 0 10px #0f0e0e"}}>
                    <HomeControls/>
                    <AwayControls/>
                </div>
            </div>
            <div>
                <AwayPenaltyClocks/>
            </div>
        </div>
    )
}

class TimerPanel extends React.Component {
    constructor(props){
        super(props);
        this.state = {tminutes:'00',tseconds:'00'};
        this.startTimer = this.startTimer.bind(this);
        this.getTimerInstance = this.getTimerInstance.bind(this);
    }
    getTimerInstance(){
        tseconds++;
        if (tseconds > 59) {
            tminutes++;
            tseconds = 0;
        }
        this.setState({tminutes:tminutes.toString().padStart(2, '0'),tseconds:tseconds.toString().padStart(2, '0')});
        if (([30, 60, 75, 90].indexOf(tminutes) > -1) && !tseconds) { this.pauseTimer(); return;}
    }
    startTimer(e){
        if (!timerRunning && tminutes != 90) {
            var obj = this;
            intervalId = setInterval(function () { 
                obj.getTimerInstance();
            }, 1000);
            timerRunning = 1;
            PostMatchInstance();
            new HomePenaltyClocks().resumeHomePenaltyClocks();
            new AwayPenaltyClocks().resumeAwayPenaltyClocks();
            document.querySelectorAll('button.setHalfButton').forEach(elem => {elem.disabled = true;});
        }
    }
    pauseTimer(e){
        clearInterval(intervalId);
        timerRunning = 0;
        PostMatchInstance();
        document.querySelectorAll('button.setHalfButton').forEach(elem => {elem.disabled = false;});
        new HomePenaltyClocks().pauseHomePenaltyClocks();
        new AwayPenaltyClocks().pauseAwayPenaltyClocks();
    }
    setHalf(t, e){
        clearInterval(intervalId);
        tminutes = t;
        tseconds = 0;
        timerRunning = 0;
        PostMatchInstance();
        this.setState({tminutes:tminutes.toString().padStart(2, '0'),tseconds:"00"});
        document.querySelectorAll('button.setHalfButton').forEach(elem => {elem.disabled = false;});
    }
    render(){
        return (
            <div style={{display:"inline-block"}}>
                <div style={{width:"170px", display:"inline-block",textAlign:"center",lineHeight:"4.5",border:"7px solid white",borderRadius:"50%",backgroundColor:"#995000"}} >
                    <div style={{marginTop:"26%",lineHeight:"normal",textShadow:"0 0 5px #0b0b0b, 0 0 5px #0f0e0e"}}>
                        <label id="timerMin" style={{fontSize:"xxx-large"}}>{this.state.tminutes}</label>
                        <span style={{fontSize:"xxx-large"}}>:</span>
                        <label id="timerSec" style={{fontSize:"xxx-large"}}>{this.state.tseconds}</label>
                    </div>
                    <div style={{marginTop:"-10px"}}>
                        <img id="btnStartTimer" src={playIcon} onClick={this.startTimer.bind(this)} width="35" height="30" alt="play" style={{cursor:"pointer",borderRadius:"100%"}}/>
                        <img id="btnPauseTimer" src={pauseIcon} onClick={this.pauseTimer.bind(this)} width="30" height="30" alt="pause" style={{cursor:"pointer",marginLeft:"5px",borderRadius:"100%"}}/> 
                    </div>
                </div>
                <div style={{textAlign:"center"}}>
                    <div style={{position: "absolute",paddingTop:"1%",margin:"auto"}}>
                        <button className="setHalfButton" title="Set clock to 00:00" onClick={this.setHalf.bind(this, 0)}>00</button>
                        <button className="setHalfButton" title="Set clock to 30:00" onClick={this.setHalf.bind(this, 30)}>30</button>
                        <button className="setHalfButton" title="Set clock to 60:00" onClick={this.setHalf.bind(this, 60)}>60</button>
                        <button className="setHalfButton" title="Set clock to 75:00" onClick={this.setHalf.bind(this, 75)}>75</button>
                    </div>
                </div>
            </div>
        )
    }
}

class HomeScorePanel extends React.Component {
    constructor(props){
        super(props);
        this.state = {score:0};
    }
    incHomeScore_click(e){
        if(this.state.score != 99){
            homeScore = this.state.score + 1;
            this.setState({score:(this.state.score + 1)}, () => {PostMatchInstance();});
        }
    }
    decHomeScore_click(e){
        if(this.state.score != 0){
            homeScore = this.state.score - 1;
            this.setState({score:(this.state.score - 1)}, () => {PostMatchInstance();});
        }
    }
    render(){
        return (
            <div style={{display:"inline-block"}}>
                <div style={{width:"40px",display:"inline-block"}}>
                    <img id="btnIncHomeScore" src={scoreUp} className="scoreButton" style={{marginBottom:"7px"}} onClick={this.incHomeScore_click.bind(this)} title="Increment Home Score"/>
                    <img id="btnDecHomeScore" src={scoreDown} className=" scoreButton" onClick={this.decHomeScore_click.bind(this)} title="Decrement Home Score"/>
                </div>
                <div style={{display:"inline-block",textAlign:"center"}}>
                    <div style={{width:"75px",margin:"auto"}}>
                        <label id="lblHomeScore" className="score">{this.state.score}</label>
                    </div>
                    <div style={{width:"125px"}}>
                        <h1 style={{marginTop:"0px",textShadow:"0 0 10px #0b0b0b, 0 0 10px #0f0e0e"}}>HOME</h1>
                    </div>
                </div>
            </div>
        )
    }
}

class AwayScorePanel extends React.Component {
    constructor(props){
        super(props);
        this.state = {score:0};
    }
    incAwayScore_click(e){
        if(this.state.score != 99){
            awayScore = this.state.score + 1;
            this.setState({score:(this.state.score + 1)}, () => {PostMatchInstance();});
        }
    }
    decAwayScore_click(e){
        if(this.state.score != 0){
            awayScore = this.state.score - 1;
            this.setState({score:(this.state.score - 1)}, () => {PostMatchInstance();});
        }
    }
    render(){
        return (
            <div style={{display:"inline-block"}}>
                <div style={{display:"inline-block",textAlign:"center"}}>
                    <div style={{width:"75px",margin:"auto"}}>
                        <label id="lblAwayScore" className="score">{this.state.score}</label>
                    </div>
                    <div style={{width:"125px"}}>
                        <h1 style={{marginTop:"0px",textShadow:"0 0 10px #0b0b0b, 0 0 10px #0f0e0e"}}>AWAY</h1>
                    </div>
                </div>
                <div style={{width:"40px",display:"inline-block"}}>
                    <img id="btnIncAwayScore" src={scoreUp} className="scoreButton" style={{marginBottom:"7px"}} onClick={this.incAwayScore_click.bind(this)} title="Increment Away Score"/>
                    <img id="btnDecAwayScore" src={scoreDown} className="scoreButton" onClick={this.decAwayScore_click.bind(this)} title="Decrement Away Score"/>
                </div>
            </div>
        )
    }
}

class HomeControls extends React.Component {
    constructor(props){
        super(props);
    }
    setHomeEmptyGoal(e){
        homeEmptyGoal = (e.target.checked ? 1 : 0);
        PostMatchInstance();
    }
    setHomeTimeout(e){
        homeTimeout = (e.target.checked ? 1 : 0);
        PostMatchInstance();
    }
    render(){
        return (
            <div style={{display:"inline-block",textAlign:"center"}}>
                <table><tbody>
                    <tr>
                        <td><label htmlFor="homeEmptyGoal"><b>Empty Goal</b></label></td>
                        <td style={{paddingLeft:"10px"}}>
                            <label className="toggleSwitch">
                                <input id="homeEmptyGoal" type="checkbox" onChange={this.setHomeEmptyGoal.bind(this)}/>
                                <span className="slider round"></span>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <td><label htmlFor="homeTimeout"><b>Timeout</b></label></td>
                        <td style={{paddingLeft:"10px"}}>
                            <label className="toggleSwitch">
                                <input id="homeTimeout" type="checkbox" onChange={this.setHomeTimeout.bind(this)} />
                                <span className="slider round"></span>
                            </label>
                        </td>
                    </tr>
                </tbody></table>
            </div>
        )
    }
}

class AwayControls extends React.Component {
    constructor(props){
        super(props);
    }
    setAwayEmptyGoal(e){
        awayEmptyGoal = (e.target.checked ? 1 : 0);
        PostMatchInstance();
    }
    setAwayTimeout(e){
        awayTimeout = (e.target.checked ? 1 : 0);
        PostMatchInstance();
    }
    render(){
        return (
            <div style={{display:"inline-block",float:"right"}}>
                <table><tbody>
                    <tr>
                        <td style={{paddingRight:"10px"}}>
                            <label className="toggleSwitch">
                                <input id="awayEmptyGoal" type="checkbox" onChange={this.setAwayEmptyGoal.bind(this)}/>
                                <span className="slider round"></span>
                            </label>
                        </td>
                        <td><label htmlFor="awayEmptyGoal"><b>Empty Goal</b></label></td>
                    </tr>
                    <tr>
                        <td style={{paddingRight:"10px"}}>
                            <label className="toggleSwitch">
                                <input id="awayTimeout" type="checkbox" onChange={this.setAwayTimeout.bind(this)} />
                                <span className="slider round"></span>
                            </label>
                        </td>
                        <td><label htmlFor="awayTimeout"><b>Timeout</b></label></td>
                    </tr>
                </tbody></table>
            </div>
        )
    }
}

class HomePenaltyClocks extends React.Component {
    constructor(props){
        super(props);
        this.state = {hp1Min:"02",hp1Sec:"00",hp2Min:"02",hp2Sec:"00",hp3Min:"02",hp3Sec:"00"}
    }
    runPenaltyClock(id, e){
        if(!timerRunning){
            alert("Cannot run penalty clock when main clock is paused");
            return;
        }
        var objP = this;
        document.getElementById(id + "Button").disabled = true;
        window[id+"Obj"].running = 1;
        window[id+"Obj"].active = 1;
        PostMatchInstance();
        window[id + "Interval"] = setInterval(function () {
            let min = parseInt(objP.state[id+"Min"]);
            let sec = parseInt(objP.state[id+"Sec"]);
            if (!sec && !min) {
                clearInterval(window[id + "Interval"]);
                min = 2; sec = 0;
                document.getElementById(id + "Button").disabled = false;
                window[id+"Obj"].running = 0;
                window[id+"Obj"].active = 0;
            }
            else if (sec == 0) { sec = 59; min--; }
            else { sec--; }
            let valObj = {}; valObj[id+"Min"] = min.toString().padStart(2, '0');valObj[id+"Sec"] = sec.toString().padStart(2, '0'); 
            objP.setState(valObj);
            window[id+"Obj"].seconds = (min*60)+sec;
        }, 1000);
    }
    pauseHomePenaltyClocks(){
        //only when main clock is paused
        //pause all running home penalty clocks
        if(window.hp1Interval){clearInterval(window.hp1Interval);window.hp1Obj.running=0;window.hp1Obj.active = 0; }
        if(window.hp2Interval){clearInterval(window.hp2Interval);window.hp2Obj.running=0;window.hp2Obj.active = 0;}
        if(window.hp3Interval){clearInterval(window.hp3Interval);window.hp3Obj.running=0;window.hp3Obj.active = 0;}
    }
    resumeHomePenaltyClocks(){
        //only when main clock is resumed
        //pause all running home penalty clocks
        if(window.hp1Obj.seconds < 120 || document.getElementById("hp1Button").disabled){ document.getElementById("hp1Button").disabled=false;document.getElementById("hp1Button").click();}
        if(window.hp2Obj.seconds < 120 || document.getElementById("hp2Button").disabled){ document.getElementById("hp2Button").disabled=false;document.getElementById("hp2Button").click();}
        if(window.hp3Obj.seconds < 120 || document.getElementById("hp3Button").disabled){ document.getElementById("hp3Button").disabled=false;document.getElementById("hp3Button").click();}
    }
    render(){
        return (
            <div id="homePenaltyClocks" style={{fontSize:"x-large",float:"left",marginLeft:"12%",marginTop:"10%"}}>
                <div>
                    <button id="hp1Button" onClick={this.runPenaltyClock.bind(this,'hp1')}>Home Penalty 1</button>
                    <div className="penaltyClock"><label id="hp1Minutes">{this.state.hp1Min}</label>:<label id="hp1Seconds">{this.state.hp1Sec}</label></div>
                </div>
                <div>
                    <button id="hp2Button" onClick={this.runPenaltyClock.bind(this,'hp2')}>Home Penalty 2</button>
                    <div className="penaltyClock"><label id="hp2Minutes">{this.state.hp2Min}</label>:<label id="hp2Seconds">{this.state.hp2Sec}</label></div>
                </div>
                <div>
                    <button id="hp3Button" onClick={this.runPenaltyClock.bind(this,'hp3')}>Home Penalty 3</button>
                    <div className="penaltyClock"><label id="hp3Minutes">{this.state.hp3Min}</label>:<label id="hp3Seconds">{this.state.hp3Sec}</label></div>
                </div>
            </div>

        )
    }
}

class AwayPenaltyClocks extends React.Component {
    constructor(props){
        super(props);
        this.state = {ap1Min:"02",ap1Sec:"00",ap2Min:"02",ap2Sec:"00",ap3Min:"02",ap3Sec:"00"}
    }
    runPenaltyClock(id, e){
        if(!timerRunning){
            alert("Cannot run penalty clock when main clock is paused");
            return;
        }
        var objP = this;
        document.getElementById(id + "Button").disabled = true;
        window[id+"Obj"].running = 1;
        window[id+"Obj"].active = 1;
        PostMatchInstance();
        window[id + "Interval"] = setInterval(function () {
            let min = parseInt(objP.state[id+"Min"]);
            let sec = parseInt(objP.state[id+"Sec"]);
            if (!sec && !min) {
                clearInterval(window[id + "Interval"]);
                min = 2; sec = 0;
                document.getElementById(id + "Button").disabled = false;
                window[id+"Obj"].running = 0;
                window[id+"Obj"].active = 0;
            }
            else if (sec == 0) { sec = 59; min--; }
            else { sec--; }
            let valObj = {}; valObj[id+"Min"] = min.toString().padStart(2, '0');valObj[id+"Sec"] = sec.toString().padStart(2, '0'); 
            objP.setState(valObj);
            window[id+"Obj"].seconds = (min*60)+sec;
        }, 1000);
    }
    pauseAwayPenaltyClocks(){
        //only when main clock is paused
        //pause all running away penalty clocks
        if(window.ap1Interval){clearInterval(window.ap1Interval);window.ap1Obj.running=0; window.ap1Obj.active=0;}
        if(window.ap2Interval){clearInterval(window.ap2Interval);window.ap2Obj.running=0; window.ap2Obj.active=0;}
        if(window.ap3Interval){clearInterval(window.ap3Interval);window.ap3Obj.running=0; window.ap3Obj.active=0;}
    }
    resumeAwayPenaltyClocks(){
        //only when main clock is resumed
        //pause all running home penalty clocks
        if((window.ap1Obj.seconds < 120 || document.getElementById("ap1Button").disabled)){ document.getElementById("ap1Button").disabled=false;document.getElementById("ap1Button").click();}
        if((window.ap2Obj.seconds < 120 || document.getElementById("ap2Button").disabled)){ document.getElementById("ap2Button").disabled=false;document.getElementById("ap2Button").click();}
        if((window.ap3Obj.seconds < 120 || document.getElementById("ap3Button").disabled)){ document.getElementById("ap3Button").disabled=false;document.getElementById("ap3Button").click();}
    }
    render(){
        return (
            <div id="awayPenaltyClocks" style={{fontSize:"x-large",float:"right",marginRight:"12%",marginTop:"-19%"}}>
                <div>
                    <button id="ap1Button" onClick={this.runPenaltyClock.bind(this,'ap1')}>Away Penalty 1</button>
                    <div className="penaltyClock"><label id="ap1Minutes">{this.state.ap1Min}</label>:<label id="hp1Seconds">{this.state.ap1Sec}</label></div>
                </div>
                <div>
                    <button id="ap2Button" onClick={this.runPenaltyClock.bind(this,'ap2')}>Away Penalty 2</button>
                    <div className="penaltyClock"><label id="ap2Minutes">{this.state.ap2Min}</label>:<label id="hp2Seconds">{this.state.ap2Sec}</label></div>
                </div>
                <div>
                    <button id="ap3Button" onClick={this.runPenaltyClock.bind(this,'ap3')}>Away Penalty 3</button>
                    <div className="penaltyClock"><label id="ap3Minutes">{this.state.ap3Min}</label>:<label id="hp3Seconds">{this.state.ap3Sec}</label></div>
                </div>
            </div>

        )
    }
}
