import React from 'react'


function Message (props){
    return (
        <div style={{
            backgroundColor: 'black',
            border: '3px solid white',
            color: 'white'}}>
        <h1>{props.message}</h1></div>
    )

}
export default Message;