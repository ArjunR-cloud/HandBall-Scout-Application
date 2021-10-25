function MatchInstancePrototype(matchId,data) {
    this.matchId = matchId;
    let date = new Date();
    this.timeStamp = date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear() + ' ' + date.toLocaleTimeString('it-IT') + '.' + date.getMilliseconds();
    this.data = data;
}
function DataPrototype(mainClock, penalties, score, teamTimeout, emptyGoal) {
    this.mainClock = mainClock;
    this.penalties = penalties;
    this.score = score;
    this.teamTimeout = teamTimeout;
    this.emptyGoal = emptyGoal;
}
function clockPrototype(type, seconds, limit, running, active, direction) {
    this.type = type;
    this.seconds = seconds;
    this.limit = limit;
    this.running = running;
    this.active = active;
    this.direction = direction;
}
function ScorePrototype(type, homeScore, awayScore) {
    this.type = type;
    this.scoreHome = homeScore;
    this.scoreAway = awayScore;
}
function TeamTimeoutPrototype(type,active) {
    this.type = type;
    this.active = active;
}
function EmptyGoalPrototype(type,active) {
    this.type = type;
    this.active = active;
}

export function getMatchInstanceObject(matchId, time, penalties, score, teamTimeout, emptyGoal) {
    const objMainClock = new clockPrototype(time.type, time.totalSeconds, time.limit, time.timerRunning, time.timerActive, time.timerDirection);
    const objPenaltiesArr = [...penalties];
    const objScore = new ScorePrototype(score.type, score.homeScore, score.awayScore);
    const objTeamTimeoutArr = [new TeamTimeoutPrototype(1, teamTimeout.homeTimeout), new TeamTimeoutPrototype(2, teamTimeout.awayTimeout)];
    const objEmptyGoalArr = [new EmptyGoalPrototype(1, emptyGoal.homeEmptyGoal), new EmptyGoalPrototype(2, emptyGoal.awayEmptyGoal)];
    const objData = new DataPrototype(objMainClock, objPenaltiesArr, objScore, objTeamTimeoutArr, objEmptyGoalArr);
    const objMatchInstance = new MatchInstancePrototype(matchId, objData);
    return objMatchInstance;
}
