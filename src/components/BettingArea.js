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

            <button style={{borderColor: 'red', color: 'red'}}value='5'  className='betButtons' onClick={this.props.handleBet.bind(this)}><span value='5' >5</span></button>
            <button style={{borderColor: 'blue', color: 'blue'}}value='10' className='betButtons' onClick={this.props.handleBet}><span value='10' >10</span></button>
            <button style={{borderColor: 'green', color: 'green'}}value='25' className='betButtons' onClick={this.props.handleBet}><span value='25' >25</span></button>
            <button className='button hand-button' onClick={this.props.placeBet} >Bet ({this.props.bet})</button>
            {this.props.doubleDown && <button className='button hand-button' onClick={this.props.doubleBet}>Double Down</button>}

        </div>
        )
    }
}
export default BettingArea;
