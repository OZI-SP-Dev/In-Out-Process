import { Link } from "react-router-dom";

function Home() {
  return (
    <div><h1>
    Welcome to the Home Page
    </h1> 
    
    <Link to="item/1">Item 1</Link><br/>
    <Link to="item/2">Item 2</Link>
     </div>
  );
}

export default Home;
