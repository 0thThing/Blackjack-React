import React from 'react'


function Message (props){
    return (
        <div style={{
            backgroundColor: 'black',
            border: '3px solid white',
            color: 'white'}}>
        <h2>{props.message}</h2></div>
    )

}
export default Message;