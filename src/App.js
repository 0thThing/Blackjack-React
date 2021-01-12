import React from 'react';
import './appStyle.css'
import './App.css';
import Game from './components/Game'
//old background in case I want to switch 'https://media.istockphoto.com/vectors/black-jack-table-vector-illustration-eps-10-casino-vector-id1147481668?k=6&m=1147481668&s=612x612&w=0&h=dWgHTNuzvPQcICP2jSQHHMld-A4Mqm2_8YqGv9YoyWM=
//https://deckofcardsapi.com/  <-- the API for the decks

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      isGameOn: false,
      deckID: "",
    }

  }


  render(){
    return (
        <div className="App"  >

          <img src='https://image.freepik.com/free-vector/poker-table-background-green-color_47243-1068.jpg' className='bg' alt={'whoops where is the background'}/>
          <Game deckID={this.state.deckID} />
        </div>
  )}

}

export default App;
