import React from 'react';
import '../Player.css'
class Dealer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

        }

    }



    render() {
        const currentHand = this.props.cards.map(prop => {
            return <div className='single-card' style={{width: '20%'}} ><img src={prop.image.png} alt="your cards arent working" className='card'/></div>
        })


        return(

            <div className='player-area'>

                <div className='value-area'>
                    <h2> Dealer: {this.props.total}</h2>
                </div>

                <div className='player-cards'>
                    {currentHand}
                </div>
            </div>
        )

    }


}

export default Dealer;