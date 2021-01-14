import React from 'react';
import Dealer from './Dealer'
import Player from './Player'
import Message from './Message'
import StatsArea from "./StatsArea";
import BettingArea from "./BettingArea";


//adding key prop fixed the Player constructor not being called when it was passed new props
//realized <li> and <ul> have padding you have to explicitly override in css
//note: highLowCount state variable is using the high-low card counting strategy that many people may not be familiar with
//This is deployed with firebase


//todo one thing THE BETTING SYSTEM IS GOOD! just add a place in the game where the player has to draw since before that is the only time you can bet

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dealerCards: [],
            dealerTotal: 0,
            playerCards: [],
            playerTotal: 0,
            deckID: "",
            cardsRemaining: 0,
            isRoundOver: false,
            userWins: 0,
            userLosses: 0,
            userDraws: 0,
            highLowCount: 0,
            funds: 100,
            currentBet: 0,
            placedBet: 0,
            message: "Good Luck!"

        }
        this.placeBet = this.placeBet.bind(this)
        this.handleHit = this.handleHit.bind(this)
        this.drawStartingHands = this.drawStartingHands.bind(this)
        this.totalHandValue = this.totalHandValue.bind(this)
        this.handleStay = this.handleStay.bind(this)
        this.shuffle = this.shuffle.bind(this)
        this.shuffleAndDraw = this.shuffleAndDraw.bind(this)
        this.findWinner = this.findWinner.bind(this)
        this.drawCards = this.drawCards.bind(this)
        this.handleBet = this.handleBet.bind(this)
        this.resetBet = this.resetBet.bind(this)
    }

    async handleHit(){

        let card = await this.drawCards(1)
        let new_card = card

        console.log('this is the card drawn',card)
        this.setState(prevState => {
            let newHandValue = this.totalHandValue([...prevState.playerCards,...new_card])
            let playerBusted = newHandValue > 21 ? true : false
            if (playerBusted)
            {
                return {
                    playerCards: [...prevState.playerCards, ...new_card],
                    playerTotal: newHandValue,
                    isRoundOver: true,
                    userLosses: prevState.userLosses + 1,
                    message: "you busted, play again?", //I dont really like this but it kind of makes sense since this is one of the ways the round ends
                    funds: prevState.funds - prevState.placedBet
                }
            }

            return {
                playerCards: [...prevState.playerCards, ...new_card],
                playerTotal: newHandValue,
                isRoundOver: false //round is over if player busted

            }
        }
    )
    }

    async handleStay() {
        // draw one card for dealer no matter what
        //drawCards returns a list since it can be used to
        let card = await this.drawCards(1)

        let dealerHand = [...card, ...this.state.dealerCards]


        while (this.totalHandValue(dealerHand) < 17) //drawing dealer
        {

            let card = await this.drawCards(1)
            dealerHand.push(...card)

        }

        this.setState(prevState => {
                let newHandValue = this.totalHandValue([...dealerHand])
                console.log('last state was', prevState)
                return {
                    dealerCards: dealerHand,
                    dealerTotal: newHandValue,
                    isRoundOver: true

                }
            }
        )
        this.findWinner(this.state.playerTotal, this.state.dealerTotal)
    }


    async drawCards(amount) {
        let hiLowValue = 0  //the variable containing the value of the card in the hi-low counting system
        let cardList = []
        const url = 'https://deckofcardsapi.com/api/deck/' + this.state.deckID + '/draw/?count=' + amount
        const response = await fetch(url)
        let data = await response.json()
        for (let i = 0; i < amount; i++) {

            let card = {
                image: data.cards[i].images,
                value: data.cards[i].value,
                suit: data.cards[i].suit,
                code: data.cards[i].code
            }
            if (card.value === "KING" || card.value === "QUEEN" || card.value === "JACK" || card.value === "ACE" || card.value ==="10") {
                hiLowValue += -1
            }
            if (card.value === "2" || card.value === "3" || card.value === "4" || card.value === "5" || card.value === "6") {
                hiLowValue += 1
            }
            cardList.push(card)
        }

        this.setState(prevState => {
            return {
                highLowCount: prevState.highLowCount + hiLowValue,
                cardsRemaining: data.remaining
            }
        })
        return cardList;


    }

    placeBet (){
        if(!this.state.isRoundOver)
        {
            this.setState({
                message:'you can not place a bet during the round, no cheating!',
                currentBet: 0
            })
        }
        else if(this.state.funds < this.state.currentBet)
        {
            this.setState({
                message:'you dont have the money for that!',
                currentBet: 0
            })//this isnt working right now

        }
        else
        {
            this.setState({
                placedBet: this.state.currentBet,
                currentBet: 0 //reset the current bet since its been placed
            })
        }
    }
    handleBet (event){
        //event.currentTarget.value somehow does not work here and I am unsure why

        let value = event.currentTarget.getAttribute('value')
        console.log('the amount trying to be added is ', value)
        this.setState(prevState => {
            return {
            currentBet: prevState.currentBet + Number(value)
            }
        })
        console.log(this.state.currentBet)
    }


    resetBet(){
        this.setState({placedBet: 0})
    }

    findWinner (playerTotal, dealerTotal){
        if (dealerTotal === playerTotal) {
            this.setState(prevState => {
                console.log('prevstate.placed bet is', prevState.placedBet)

                return {
                    userDraws: prevState.userDraws + 1,
                    message: "its a draw"

                }
            })
        }
        else if ((this.state.dealerTotal > 21 && this.state.playerTotal <= 21) || (this.state.dealerTotal < this.state.playerTotal && this.state.playerTotal < 22))
        {
                this.setState(prevState => {

                    return {
                        userWins: prevState.userWins + 1,
                        funds: prevState.funds + prevState.placedBet,
                        message: 'you won!'
                    }
                })
            }
        else if (this.state.playerTotal > 21)// these last two share the same outcome and can be combined I think
        {
            this.setState(prevState => {

                return {
                    userLosses: prevState.userLosses + 1,
                    funds: prevState.funds - prevState.placedBet,
                    message: 'you busted'
                }
            })
        }
        else
        {
            this.setState(prevState => {

                return {
                    userLosses: prevState.userLosses + 1,
                    funds: prevState.funds - prevState.placedBet,
                    message: 'you lost'
                }
            })
        }
    }


    async shuffle(){
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        let data = await response.json()
        this.setState({
            deckID: data.deck_id,
            cardsRemaining: data.remaining,
            playerCards: [],
            dealerCards: [],
            highLowCount: 0

        })

    }

    async shuffleAndDraw() { //actually made for the reshuffle button since both these need to be ran after reshuffle is clicked
            // or else the deck is shuffled and there are no cards and no way to draw a starting hand
        await this.shuffle()
        await this.drawStartingHands()
    }

    async componentDidMount() {
        //when the component mounts we start a new deck and hand
        await this.shuffleAndDraw()
    }

    async drawStartingHands(){

        let cards = await this.drawCards(3)
        let newPlayerCards = [cards[0],cards[1]]
        let startPlayerValue = this.totalHandValue(newPlayerCards)

        let newDealerCard = [cards[2]]
        //list containing 1 is strange but it allows the totalhandvalue function to access the .length property
        let startDealerValue = this.totalHandValue(newDealerCard)
        console.log('hand values after drawing cards are', startDealerValue, 'player: ',startPlayerValue)

        this.setState(prevState => {

            return {
                dealerCards: [...newDealerCard],
                playerCards: [...newPlayerCards],
                playerTotal: startPlayerValue,
                dealerTotal: startDealerValue,
                isRoundOver: false,
                message: 'Good Luck!'
            }
        })

    }


    totalHandValue(hand) {

        let card;
        let sum=0;
        let highAces = 0

        for (let i =0;i<hand.length;i++) {
            card = hand[i]
            if (card.value === "KING" || card.value === "QUEEN" || card.value ==="JACK")
            {
                sum+=10
            }
            else if (card.value ==="ACE")
            {
                highAces += 1
                sum += 11
            }
            else
            {
                sum = sum + Number(card.value)
            }

        }
        while (sum > 21 && highAces > 0 )
        {
            console.log('making adjustments for the aces')
            sum -= 10
            highAces--
        }
        console.log('here is the sum ' ,sum)
        return sum

    }


    render() {
//the key for <Dealer> needs to be dealerTotal otherwise the value above dealer cards doesnt go away and new
        //totals just keep being added, maybe its because that part of <dealer> doesnt need to change?

        return (

            <div >
                <StatsArea key={this.state.highLowCount}

                           wins={this.state.userWins}
                           losses={this.state.userLosses}
                           draws={this.state.userDraws}
                           cardsRemaining={this.state.cardsRemaining}
                           highLowCount={this.state.highLowCount}
                           funds={this.state.funds}
                />

                <Dealer key={this.state.dealerTotal} cards={this.state.dealerCards} total={this.state.dealerTotal}/>
                {console.log(this.state.playerCards, this.state.deckID)}
                <Message  message={this.state.message}/>

                <button className='button hand-button' onClick={this.shuffleAndDraw}>shuffle</button>
                {this.state.isRoundOver ? <button className='button hand-button' onClick={this.drawStartingHands}>New Hand</button> : <button className='button hand-button' onClick={this.handleHit}>Draw</button>}
                {!this.state.isRoundOver && <button className='button hand-button' onClick={this.handleStay}>Stay</button>}

                <Player key={this.state.playerCards} cards={this.state.playerCards} total={this.state.playerTotal} handleBet={this.handleBet} bet={this.state.placedBet}/>
                <div style={{display: 'block', marginTop: '1%'}}>
                    <BettingArea handleBet={this.handleBet} placeBet={this.placeBet} bet={this.state.currentBet}/>
                </div>


            </div>
        )
    }
}

export default Game;

