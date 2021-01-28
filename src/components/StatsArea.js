import React from 'react'
import '../Player.css'
function StatsArea(props) {
    //happy this rounding works but note roundedTrueCount is now a string
    let roundedTrueCount = props.trueCount.toFixed(2)
    return (
        <div className='stats-area'>
            <ol style={{listStyle:'none'}}>
                <li>· Wins: {props.wins}</li>
                <li>· Losses: {props.losses}</li>
                <li>· Draws: {props.draws}</li>
                <li>· Cards Left: {props.cardsRemaining}</li>
                <li>· Running Count: {props.runningCount}</li>
                <li>· True Count: {roundedTrueCount}</li>
                <li>· Money: {props.funds}</li>

            </ol>
        </div>
    )
}

export default StatsArea;