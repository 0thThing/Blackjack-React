import React from 'react';
import '../Player.css'
class Dealer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

        }
        console.log('here are the props in dealer', this.props)
    }



    render() {
        const currentHand = this.props.cards.map(prop => {
            return <div><img src={prop.image.png} alt="your cards arent working" className='card'/></div>
        })


        return(

            <div>

                <div className='value-area'>
                    <h2> Dealer: {this.props.total}</h2>
                </div>

                <div className='dealer-card-area'>
                    {currentHand}
                </div>
            </div>
        )

    }


}

export default Dealer;