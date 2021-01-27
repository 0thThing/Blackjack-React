import React from 'react';
import '../Player.css'

class Player extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            handValue: 0
        }

        console.log('Player has these props: ',this.props)
    }



    render() {

        const currentHand = this.props.cards.map(prop => {
            return <div className='single-card' style={{width: '24%'}}><img src={prop.image.png} alt="your cards arent working" className='card'/></div>//I think its this image that keeps giving the error, it needs a key like the suit and value of the card
        })

        return(
            <div className='player-area'>
                <div className='value-area'>
                    <h2> Your Hand: {this.props.total}, Your Bet: {this.props.bet} </h2>
                </div>
                <div className='player-cards'>
                    {currentHand}
                </div>

            </div>
        )

    }

}

export default Player;