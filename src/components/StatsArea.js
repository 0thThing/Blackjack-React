import React from 'react'
import '../Player.css'
function StatsArea(props) {
    console.log('props in stats area', props)
    return (
        <div className='stats-area'>
            <ol>
                <li>· Wins: {props.wins}</li>
                <li>· Losses: {props.losses}</li>
                <li>· Draws: {props.draws}</li>
                <li>· Cards Left: {props.cardsRemaining}</li>
                <li>· Count: {props.highLowCount}</li>
                <li>· Money: {props.funds}</li>

            </ol>
        </div>
    )
}

export default StatsArea;