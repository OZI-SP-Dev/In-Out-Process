import { PrimaryButton } from "@fluentui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IItem, ItemApiConfig } from "./api/ItemApi";

function Item() {
 
  let { itemNum } = useParams();

  const itemApi = ItemApiConfig.getApi();

  const [item,setItem] = useState<IItem>({Id:0, Title:""});

  async function updateItem()
  {
    let updatedItem = {...item, Title: "TEST"}
    let res = await itemApi.updateItem(updatedItem);
    return res;
  }

  useEffect(() => {

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

    <PrimaryButton text="Update" onClick={updateItem}></PrimaryButton>

     </div>
  );
}

export default Item;
