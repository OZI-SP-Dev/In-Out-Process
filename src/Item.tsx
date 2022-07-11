import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IItem, ItemApiConfig } from "./api/ItemApi";

function Item() {
 
  let { itemNum } = useParams();

  const [item,setItem] = useState<IItem>({ID:0, Title:""});


  useEffect(() => {

    const itemApi = ItemApiConfig.getApi();

    async function loadItem(){
      let res = await itemApi.getItemById(Number(itemNum));
      if (res) {
        setItem(res);
      }
    }

    loadItem();
  },[itemNum]);
 

  return (
    <div><h1>
    Welcome to the Item Page
    </h1> 
    
    <p>Getting info for {itemNum}</p>
    <p>Response: {item.Title}</p>

     </div>
  );
}

export default Item;
