import { useParams } from "react-router-dom";

function Item() {
 
  let { itemNum } = useParams();

  return (
    <div><h1>
    Welcome to the Item Page
    </h1> 
    
    <p>This is for item {itemNum}</p>

     </div>
  );
}

export default Item;
