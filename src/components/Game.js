import React from 'react';
import Dealer from './Dealer'
import Player from './Player'
import Message from './Message'
import StatsArea from "./StatsArea";
import BettingArea from "./BettingArea";
import {BlankCard} from "./BlankCard";
import ReactCardFlip from "react-card-flip";

//Made by Jordan Lawrence
//not sure how error proof this is, maybe I should have a fetch and .catch in case something goes wrong
//adding key prop fixed the Player constructor not being called when it was passed new props
//realized <li> and <ul> have padding you have to explicitly override in css
//note: runningCount state variable is using the high-low card counting strategy that many people may not be familiar with
//This is deployed with firebase at https://blackjack-65c0d.web.app/
//todo not sure why handleBet is passed to player and I think it has no purpose
//todo all the hands should be in the same array of arrays, since implementing split made me have an array of arrays the player hand should be in there to
//todo realized just now that 3 to 2 payout has not been implemented for blackjack, as well as insurance
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            remainingHands: 0, //might not actually need this since split hands.length might work as a counter
            playerHands: [], //This should be a list of lists. where each list is a split hand, and within that list is a list of cards for that hand
            playerBets: [], //parallel list of bets for the player hands
            dealerCards: [],
            dealerTotal: 0,
            playerCards: [],//redundant and was really only used in the first iteration when there was no splitting option
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
            runningCount: 0,
            trueCount: 0,
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


        this.findWinner = this.findWinner.bind(this)
        this.drawCards = this.drawCards.bind(this)
        this.handleDoubleDown = this.handleDoubleDown.bind(this)
        this.handleSplit = this.handleSplit.bind(this)
        this.clearHands = this.clearHands.bind(this)
        this.checkForBust = this.checkForBust.bind(this)

        this.rotateSplitHand = this.rotateSplitHand.bind(this)
        this.evaluateHands = this.evaluateHands.bind(this)
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

            let newPlayerCards = [...prevState.playerHands[0], ...new_card]
            let newHandValue = this.totalHandValue(newPlayerCards)
            let playerHands = [...prevState.playerHands]
            playerHands[0] = newPlayerCards
            // we have to delete the old hand stored in playerHands
            console.log('the new player hands is ', playerHands)
            console.log('maybe drawPlayer card is the one respoinsible: '+newHandValue)

            return {
                playerCards: newPlayerCards,
                playerTotal: newHandValue,
                playerHands: playerHands,
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
                })
                this.evaluateHands(this.state.playerHands,this.state.playerBets)
            }//EVAL SPLIT HANDS HERE
        }
        return playerBusted

    }

    evaluateHands(playerHands, playerBets) {//there is something I dont like here and its that the setState for each hand is overwritten if there is more than one hand, which is inefficent
        let dealerTotal = this.state.dealerTotal
        let fundAdjustment = 0 //just the sum of the bets lost and won
        let winCount = 0
        for (let i = 0; i < playerHands.length; i++) {
            if(playerBets[i]=== undefined) //this is just so we do not add or subtract undefined
            {
                playerBets[i] = 0
            }
            let handValue = this.totalHandValue(playerHands[i])

            if (handValue > 21) {
                fundAdjustment -= playerBets[i]
                console.log('the fund adjustment after loss is now: ', fundAdjustment)
                this.setState(prevState => {

                    return {
                        userLosses: prevState.userLosses + 1,
                        message: 'its a draw'
                    }
                })
            } else if (dealerTotal === handValue) {
                //no need to adjust funds since we drew the hand
                this.setState(prevState => {

                    return {
                        userDraws: prevState.userDraws + 1,
                        message: 'you won! :)'
                    }
                })
            } else if ((dealerTotal > 21 && handValue <= 21) || (this.state.dealerTotal < handValue && handValue <= 21)) {
                fundAdjustment += playerBets[i]
                winCount++
                this.setState(prevState => {
                    console.log('the fund adjustment after win is now: ', fundAdjustment)

                    return {
                        userWins: prevState.userWins + 1,
                        message: 'you won! :)'
                    }
                })
            } else {
                fundAdjustment -= playerBets[i]
                console.log('the fund adjustment after loss by default is now: ', fundAdjustment)
                this.setState(prevState => {

                    return {
                        userLosses: prevState.userLosses + 1,
                        message: 'you lost :('
                    }
                })
            }

        }


        if(playerHands.length > 1)
        {
            this.setState(prevState => {

                return{
                    funds: prevState.funds + fundAdjustment,
                    message: 'you won '+winCount+' out of '+playerHands.length+' hands'
                }
            })
        }
        else
            {
            this.setState(prevState => {

                return{
                    funds: prevState.funds + fundAdjustment,

                }
            })
        }

    }



    rotateSplitHand(){
        //this should just rotate the playerHands and bet parralel arrays
        this.setState(prevState =>
        {
            let newPlayerHands = [...prevState.playerHands]
            let newBetList = [...prevState.playerBets]
            for (let i = 0; i < newPlayerHands.length-1; i++)
            {
                newPlayerHands.push(newPlayerHands.shift()) //this should move the front of the array to the back
                newBetList.push(newBetList.shift()) //this should move the front of the array to the back
            }
            console.log('new player hands will be ' , newPlayerHands)
            let newPlayerTotal = this.totalHandValue(newPlayerHands[0]) //get the total for the new list at the front
            let newPlayerBet = newBetList[0]


            //WOW there is a difference between console.log('stuff' + var) and console.log('stuff', var)


            return{

                playerHands: newPlayerHands,
                playerTotal: newPlayerTotal,
                remainingHands: prevState.remainingHands - 1,
                playerBets: newBetList,
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

        this.evaluateHands(this.state.playerHands,this.state.playerBets)
    }



    async drawCards(amount) {
        if(this.state.cardsRemaining < amount ){//simple really, if there arent enough cards to draw from then shuffle a new deck
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
            let newRunningCount = prevState.runningCount + hiLowValue
            let newTrueCount = newRunningCount/(data.remaining/52)
            return {
                runningCount: prevState.runningCount + hiLowValue,
                cardsRemaining: data.remaining,
                trueCount: newTrueCount, //true count is just the running count divided by how many decks are left, to get a concentration of high vs low cards per deck
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
            this.setState(prevState => {
                return{
                    playerBets: [...prevState.playerBets, this.state.currentBet],
                    totalBet: this.state.currentBet,
                    currentBet: 0 //reset the current bet since its been placed
                }

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


    clearHands () { //we use prevstate here just so that the last rounds bet will persist through the rounds
        this.setState(prevState => {
            return{
                playerCards: [],
                dealerCards: [],
                playerTotal: 0,
                dealerTotal: 0,
                isBettingPhase: true,
                playerHands: [],
                playerBets: [prevState.betAtRoundStart],
                totalBet: prevState.betAtRoundStart,
                message: 'place your bet by clicking the poker chips then the button beside them!'
            }

        })
    }

    async shuffle(){
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        let data = await response.json()
        this.setState({
            deckID: data.deck_id,
            cardsRemaining: data.remaining,
            runningCount: 0 //count must be set to 0 since the cards are shuffled

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
            let newBets = [...prevState.playerBets]
            newBets[0] = newBets[0] * 2
            return{
                playerBets: newBets,
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
            console.log('player has these split hands ', [[prevState.playerCards[1], cards[1]], ...prevState.playerHands])

            let newPlayerHand = [prevState.playerHands[0][0],cards[0]] //we create a new hand from the first card in the first hand of the player and a drawn card
            let newPlayerTotal = this.totalHandValue(newPlayerHand)
            let splitHand = [prevState.playerHands[0][1], cards[1]] //another hand from the second card in the old player hand and another drawn card
            let allHands = [...prevState.playerHands]
            allHands[0] = splitHand//we overwrite the old player hand with one of the hands created
            allHands.unshift(newPlayerHand) //add the other hand to the front of the list to act as the active hand
            


            //I think there might be an error here in keeping the arrays parallel



                return {
                    playerCards: [prevState.playerCards[0], cards[0]],
                    playerHands: allHands,
                    playerBets: [...prevState.playerBets, prevState.betAtRoundStart],
                    totalBet: prevState.totalBet + prevState.betAtRoundStart,
                    playerTotal: newPlayerTotal,
                    remainingHands: prevState.remainingHands + 1,
                    canSplit: prevState.playerHands[0][0].value === cards[0].value//checking if we can still split again, still need to make sure the other hand can or cant split though
                }

        }, () => {
            console.log('player cards are now: ',this.state.playerCards)
            console.log('the other hand is: ',this.state.playerHands)
        })
    }


    async componentDidMount() {
        //when the component mounts we start a new deck(we used to draw a hand as well but since you can not bet once the hand is dealt I removed it
        await this.shuffle()
    }

    async drawStartingHands(){
        if(this.state.playerBets[0] > this.state.funds) //we have a check against this in placeBet, one thing it does not cover though is losing money until you have a placed bet higher than your funds, that case is what this is for
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
                playerHands: [newPlayerCards], //playerHands must be a list of lists of cards so this should be right
                playerTotal: startPlayerValue,
                dealerTotal: startDealerValue,
                isRoundOver: false,
                isBettingPhase: false,
                canSplit: playerCanSplit,
                canDoubleDown: true,
                message: 'Good Luck!',
                remainingHands: 1, //dont like to hard code this but I plan to only call this once at the start since it deals the dealer as well
                betAtRoundStart: prevState.playerBets[0]
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
        //totals just keep being added, oh I figured out why, its because the value area is on player and dealer and they might have the same key which messes up React

        let splitPlayerHands = null
        if (this.state.playerHands)//im not even sure I need to check this (I think the empty list evaluates to false anyways)
        {

            splitPlayerHands = this.state.playerHands.map((hand, index) => {
                console.log('one hand from the map in render: ', hand)
                let splitBet = this.state.playerBets[index]
                console.log(splitBet)
                return <Player key={hand} cards={hand} total={this.totalHandValue(hand)} handleBet={this.handleBet} bet={splitBet}/>

        })
        }


        console.log('split player hands: ',splitPlayerHands)
        return (

            <div >
                <StatsArea key={this.state.runningCount}

                           wins={this.state.userWins}
                           losses={this.state.userLosses}
                           draws={this.state.userDraws}
                           cardsRemaining={this.state.cardsRemaining}
                           runningCount={this.state.runningCount}
                           funds={this.state.funds}
                           trueCount={this.state.trueCount}
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
                {this.state.isBettingPhase && <Player key={[BlankCard, BlankCard]} cards={[BlankCard, BlankCard]} total={0} handleBet={this.handleBet} bet={this.state.playerBets[0]}/>}
                {splitPlayerHands}
                <div style={{display: 'block', marginTop: '1%'}}>
                    <BettingArea handleBet={this.handleBet} placeBet={this.placeBet} bet={this.state.currentBet} doubleDown={this.state.canDoubleDown} doubleBet={this.handleDoubleDown}/>
                </div>
            </div>
        )
    }
}
export default Game;

