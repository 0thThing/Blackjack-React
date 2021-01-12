import React from 'react'
import '../Player.css'
class BettingArea extends React.Component{
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render(){
        return(
        <div style={{display: 'block'}}>
            <button value='5'  className='betButtons' onClick={this.props.handleBet}>5</button>
            <button value='10' className='betButtons' onClick={this.props.handleBet}>10</button>
            <button value='25' className='betButtons' onClick={this.props.handleBet} >25</button>
            <button className='button hand-button' onClick={this.props.placeBet} >Bet ({this.props.bet})</button>


        </div>
        )
    }
}
export default BettingArea;
