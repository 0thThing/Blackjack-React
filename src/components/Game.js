import React from 'react';
import Dealer from './Dealer'
import Player from './Player'
import Message from './Message'
import StatsArea from "./StatsArea";
import BettingArea from "./BettingArea";

//Made by Jordan Lawrence
//not sure how error proof this is, maybe I should have a fetch and .catch in case something goes wrong
//adding key prop fixed the Player constructor not being called when it was passed new props
//realized <li> and <ul> have padding you have to explicitly override in css
//note: highLowCount state variable is using the high-low card counting strategy that many people may not be familiar with
//This is deployed with firebase at https://blackjack-65c0d.web.app/
//todo not sure why handleBet is passed to player and I think it has no purpose
//todo all the hands should be in the same array of arrays, since implementing split made me have an array of arrays the player hand should be in there to
//todo realized just now that 3 to 2 payout has not been implemented for blackjack, as well as insurance
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            remainingHands: 0, //might not actually need this since split hands.length might work as a counter
            splitHands: [], //This should be a list of lists. where each list is a split hand, and within that list is a list of cards for that hand
            splitBets: [], //parallel list of bets for the split hands
            dealerCards: [],
            dealerTotal: 0,
            playerCards: [],
            playerTotal: 0,
            deckID: "",
            cardsRemaining: 0,
            canDoubleDown: true,
            canSplit: false,
            isRoundOver: true,
            isBettingPhase: true,
            userWins: 0,
            userLosses: 0,
            userDraws: 0,
            highLowCount: 0,
            funds: 200,
            currentBet: 0,
            placedBet: 0,
            totalBet: 0, //this is for keeping a running total of splitBet and any doubledowns, I could loop through splitBet but this seems like it might be more efficient
            betAtRoundStart: 0, //I dont want to use this if I can avoid it, but this is just to keep track of the bet that should be added when a user splits
            message: "Welcome!"

        }
        this.drawPlayerCard = this.drawPlayerCard.bind(this)
        this.placeBet = this.placeBet.bind(this)
        this.handleBet = this.handleBet.bind(this)
        this.resetBet = this.resetBet.bind(this)
        this.drawStartingHands = this.drawStartingHands.bind(this)
        this.handleHit = this.handleHit.bind(this)
        this.handleStay = this.handleStay.bind(this)
        this.totalHandValue = this.totalHandValue.bind(this)
        this.shuffle = this.shuffle.bind(this)
        this.shuffleAndDraw = this.shuffleAndDraw.bind(this) //think this can be deleted its only used in componentDidMount
        this.findWinner = this.findWinner.bind(this)
        this.drawCards = this.drawCards.bind(this)
        this.handleDoubleDown = this.handleDoubleDown.bind(this)
        this.handleSplit = this.handleSplit.bind(this)
        this.clearHands = this.clearHands.bind(this)
        this.checkForBust = this.checkForBust.bind(this)

        this.rotateSplitHand = this.rotateSplitHand.bind(this)
        this.evaluateSplitHands = this.evaluateSplitHands.bind(this)
    }

    async handleHit(){
        await this.drawPlayerCard()
        this.checkForBust(this.state.playerTotal)
    }
    async drawPlayerCard(){
        //draw a card and set the new state with hand and total
        //callback to figure out if we have busted and if there are more hands to act on and handle all the situations
        let card = await this.drawCards(1)
        let new_card = card

        this.setState(prevState => {
            let newHandValue = this.totalHandValue([...prevState.playerCards, ...new_card])
            console.log('maybe drawPlayer card is the one respoinsible: '+newHandValue)

            return {
                playerCards: [...prevState.playerCards, ...new_card],
                playerTotal: newHandValue
            }
        })


    }

    checkForBust(total){
        //if we bust check how many hand are left and return false, if we didnt bust do nothing and return true
        let playerBusted = false
        if (total > 21) {
            playerBusted = true
            if (this.state.remainingHands > 1) {
                this.rotateSplitHand()
                this.setState(prevState => {
                    return {
                        message: 'too many, hopefully the other hands work out better',
                    }

                })
            }
            else {

                this.setState(prevState => {

                    //here we just have to handle a regular bust
                    return {
                        isRoundOver: true,
                        canDoubleDown: false,
                        isBettingPhase: false,
                        message: 'too many, play again?',
                        funds: prevState.funds - prevState.placedBet
                    }
                },this.evaluateSplitHands(this.state.splitHands,this.state.splitBets)) //we have already taken care of the current player hand and bet so just the possible split hands must be passed in
            }//EVAL SPLIT HANDS HERE
        }
        return playerBusted

    }

    evaluateSplitHands(splitHands, splitBets) {
        if (splitHands.length === 0) {
            //we have no split hands so return
            return
        }
        else {
            let dealerTotal = this.state.dealerTotal
            let fundAdjustment = 0 //thought this would be easier since I do not want to call setState over and over if it can be avoided
            for (let i = 0; i < splitHands.length; i++) {
                let handValue = this.totalHandValue(splitHands[i])

                if (handValue > 21) {
                    fundAdjustment -= splitBets[i]
                    console.log('the fund adjustment after loss is now: ',fundAdjustment)
                    this.setState(prevState => {

                        return {
                            userLosses: prevState.userLosses + 1,

                        }
                    })
                } else if (dealerTotal === handValue) {
                    //no need to adjust funds since we drew the hand
                    this.setState(prevState => {

                        return {
                            userDraws: prevState.userDraws + 1,

                        }
                    })
                } else if ((dealerTotal > 21 && handValue <= 21) || (this.state.dealerTotal < handValue && handValue <= 21)) {
                    fundAdjustment += splitBets[i]
                    this.setState(prevState => {
                        console.log('the fund adjustment after win is now: ',fundAdjustment)

                        return {
                            userWins: prevState.userWins + 1,
                        }
                    })
                }
                else{
                    fundAdjustment -= splitBets[i]
                    console.log('the fund adjustment after loss by default is now: ',fundAdjustment)
                    this.setState(prevState => {

                        return {
                            userLosses: prevState.userLosses + 1,

                        }
                    })
                }
            }

            this.setState(prevState => {
                return{funds: prevState.funds + fundAdjustment}
            })

        }
    }


    rotateSplitHand(){
        //this should just rotate the split hand and bet parralel arrays
        this.setState(prevState =>
        {
            let newSplitHands = [...prevState.splitHands]
            console.log('the newSplithands cariable in handleStay befoire player cardds', newSplitHands)
            let newPlayerHand = newSplitHands.shift() //shift is like pop but from the other side, works great!
            newSplitHands.push(prevState.playerCards)
            let newPlayerTotal = this.totalHandValue(newPlayerHand)

            let newSplitBets = [...prevState.splitBets]
            let newPlayerBet = newSplitBets.shift()
            newSplitBets.push(prevState.placedBet)


            //WOW took so long to notice there is a diference between console.log('stuff' + var) and console.log('stuff', var)


            return{
                playerCards: newPlayerHand,
                splitHands: newSplitHands,
                playerTotal: newPlayerTotal,
                remainingHands: prevState.remainingHands - 1,
                splitBets: newSplitBets,
                placedBet: newPlayerBet,


            }
        })
    }

    async handleStay() {//this is awesome and close but only swaps front and back ion the array and we want whole aray to shift
        // draw one card for dealer no matter what
        if(this.state.remainingHands > 1)
        {
            //if we have split hands then this should just stay on hands until there are no hands to act on then draw dealer

            this.rotateSplitHand()


            return

        }

        let card = await this.drawCards(1)

        let dealerHand = [...card, ...this.state.dealerCards]


        while (this.totalHandValue(dealerHand) < 17) //drawing dealer to at least 17
        {

            let card = await this.drawCards(1)
            dealerHand.push(...card)

        }

        this.setState(prevState => {
                let newHandValue = this.totalHandValue([...dealerHand])
                return {
                    dealerCards: dealerHand,
                    dealerTotal: newHandValue,
                    isRoundOver: true,
                    canDoubleDown: false,

                }
            }
        )
        console.log('befoer it goes to find winner player total was: '+this.state.playerTotal)
        this.findWinner(this.state.playerTotal, this.state.dealerTotal)

        this.evaluateSplitHands(this.state.splitHands,this.state.splitBets)
    }



    async drawCards(amount) {
        if(this.state.cardsRemaining < 4){//4 seems arbitrary but since drawStartingHands() draws three cards leaving it at 1 will likely cause an error. havent tried it though
            await this.shuffle()
        }

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
            })

        }
        else
        {
            this.setState({
                placedBet: this.state.currentBet,
                totalBet: this.state.currentBet,
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
        console.log('player total is: '+playerTotal+' dealer total: '+dealerTotal)
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


    clearHands () {
        this.setState({
            playerCards: [],
            dealerCards: [],
            playerTotal: 0,
            dealerTotal: 0,
            isBettingPhase: true,
            splitHands: [],
            splitBets: [],
            totalBet: 0,
            message: 'place your bet by clicking the poker chips then the button beside them!'
        })
    }

    async shuffle(){
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        let data = await response.json()
        this.setState({
            deckID: data.deck_id,
            cardsRemaining: data.remaining,
            highLowCount: 0 //count must be set to 0 since the cards are shuffled

        })

    }

    async handleDoubleDown(){//we need to draw a card and then stay basically
        // some weird math but since double down is only available for the first two cards this makes sense
        if(this.state.totalBet + this.state.betAtRoundStart * 2 > this.state.funds)
        {
            alert('sorry you do not have enough money to double your bet')
            return
        }
        this.setState(prevState => {
            console.log('the placed bet was: ',prevState.placedBet)
            return{
                placedBet: prevState.placedBet * 2,
                totalBet: prevState.totalBet + prevState.betAtRoundStart //just update the new totalBet
            }
        })
        await this.drawPlayerCard()
        let didBust = this.checkForBust(this.state.playerTotal)
        if(!didBust){
            await this.handleStay()
        }
       //the one problem was that handleHit would end the hand if it busts and rotate the hand then when handleStay is called its like the next hand is automatically played
            //***FIXED
    }


    async handleSplit(){
        //we check if split is possible then if it is we draw the cards from the deck and update the hands


        let newTotalBet = this.state.totalBet + this.state.betAtRoundStart
        if(newTotalBet > this.state.funds)
        {
            alert('you can not split, you have: '+this.state.funds+'$ but your total bet would be: '+newTotalBet)
            return //just get out of handleSplit since its not possible
        }

        let cards = await this.drawCards(2)//we draw cards now since we know user has the funds
        console.log(cards)

        this.setState(prevState => {
            console.log('player has these split hands ', [[prevState.playerCards[1], cards[1]], ...prevState.splitHands])
            let newPlayerTotal = this.totalHandValue([prevState.playerCards[0], cards[0]])


            //new part here



                return {
                    playerCards: [prevState.playerCards[0], cards[0]],
                    splitHands: [[prevState.playerCards[1], cards[1]], ...prevState.splitHands],//hopefully this is a list of lists
                    splitBets: [...prevState.splitBets, prevState.betAtRoundStart],
                    totalBet: prevState.totalBet + prevState.betAtRoundStart,
                    playerTotal: newPlayerTotal,
                    remainingHands: prevState.remainingHands + 1,
                    canSplit: prevState.playerCards[0].value === cards[0].value//checking if we can still split again, still need to make sure the other hand can or cant split though
                }

        }, () => {
            console.log('player cards are now: ',this.state.playerCards)
            console.log('the other hand is: ',this.state.splitHands)
        })
    }

    async shuffleAndDraw() { //actually made for the reshuffle button since both these need to be ran after reshuffle is clicked
            // or else the deck is shuffled and there are no cards and no way to draw a starting hand
        await this.shuffle()
        await this.drawStartingHands()
    }

    async componentDidMount() {
        //when the component mounts we start a new deck(we used to draw a hand as well but since you can not bet once the hand is dealt I removed it
        await this.shuffle()
    }

    async drawStartingHands(){
        if(this.state.placedBet > this.state.funds) //we have a check against this in placeBet, one thing it does not cover though is losing money until you have a placed bet higher than your funds, that case is what this is for
        {
            alert('your bet is too high! you have to lower your bet to be below the amount of money')
            return;
        }
        let cards = await this.drawCards(3)
        let newPlayerCards = [cards[0],cards[1]]
        let playerCanSplit = false;
        if(cards[0].value === cards[1].value) // maybe this check can be moved to the render method?
        {
            playerCanSplit = true;
        }

        let startPlayerValue = this.totalHandValue(newPlayerCards)

        let newDealerCard = [cards[2]]
        //list containing 1 is strange but it allows the totalHandValue function to access the .length property
        let startDealerValue = this.totalHandValue(newDealerCard)


        this.setState(prevState => {

            return {
                dealerCards: [...newDealerCard],
                playerCards: [...newPlayerCards],
                playerTotal: startPlayerValue,
                dealerTotal: startDealerValue,
                isRoundOver: false,
                isBettingPhase: false,
                canSplit: playerCanSplit,
                canDoubleDown: true,
                message: 'Good Luck!',
                remainingHands: 1, //dont like to hard code this but I plan to only call this once at the start since it deals the dealer as well
                betAtRoundStart: prevState.placedBet
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
            sum -= 10
            highAces--
        }

        return sum

    }


    render() {
//the key for <Dealer> needs to be dealerTotal otherwise the value above dealer cards doesnt go away and new
        //totals just keep being added, maybe its because that part of <dealer> doesnt need to change?

        let splitPlayerHands = null
        if (this.state.splitHands)//im not even sure I need to check this (I think the empty list evaluates to false anyways)
        {

            /*splitPlayerHands = this.state.splitHands.map((hand, index) => {
                const bet = this.state.splitBets[index];
                return <Player key={hand} cards={hand} total={this.totalHandValue(hand)} handleBet={this.handleBet} bet={bet}/>
            });*/
            splitPlayerHands = this.state.splitHands.map((hand, index) => {
                console.log('the index is: ', index)
                let splitBet = this.state.splitBets[index]
                console.log(splitBet)
                return <Player key={hand} cards={hand} total={this.totalHandValue(hand)} handleBet={this.handleBet} bet={splitBet}/>

        })
        }


        console.log('split player hands: ',splitPlayerHands)
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
                <Message  message={this.state.message}/>

                {
                    //this is messy logic making the buttons but basically there are three phases this button goes through, one is during the hand when it draws 1 card
                    //the second is clearing the hand after the player has won or lost the hand. the third is after the hand is cleared and the player can bet
                    //the player can still bet if the hand is over and not cleared though, which is intentional
                }
                {this.state.isRoundOver ? this.state.isBettingPhase ? <button className='button hand-button' onClick={this.drawStartingHands}>Deal Hands</button> : <button className='button hand-button' onClick={this.clearHands}>New Hand</button> : <button className='button hand-button' onClick={this.handleHit}>Draw</button>}
                {!this.state.isRoundOver && <button className='button hand-button' onClick={this.handleStay}>Stay</button>}
                <button className='button hand-button' onClick={this.handleSplit}>Split</button>
                <Player key={this.state.playerCards} cards={this.state.playerCards} total={this.totalHandValue(this.state.playerCards)} handleBet={this.handleBet} bet={this.state.placedBet}/>
                {splitPlayerHands}
                <div style={{display: 'block', marginTop: '1%'}}>
                    <BettingArea handleBet={this.handleBet} placeBet={this.placeBet} bet={this.state.currentBet} doubleDown={this.state.canDoubleDown} doubleBet={this.handleDoubleDown}/>
                </div>
            </div>
        )
    }
}
export default Game;

