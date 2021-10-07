const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");
const itemsSchema = {
  name: String
}
const customListSchema = {
  name: String,
  items: [itemsSchema]
}
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", customListSchema);

const itemOne = new Item({
  name: "Welcome to to-do list"
});

const itemTwo = new Item({
  name: "Hit + to add new item to the list"
});

const itemThree = new Item({
  name: "<-- Hit this to delete item from the list."
});
const defaultItems = [itemOne, itemTwo, itemThree];


app.get("/", function(req, res){
  Item.find(function(err, foundResults){
    if(err){
      console.log(err);
    }
    else{
      if(foundResults.length === 0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }
          else{
            res.redirect("/")
          }
        });
      }
      else{
        res.render("list", {listTitle: "Today", newListItems: foundResults, date: date.getDate()});
      }
    }
  })

});

app.post("/", function(req, resp){
  const itemName = req.body.newItem
  const newItem = new Item({
    name: itemName
  });
  if(req.body.listTitle === "Today"){
    newItem.save();
    resp.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: req.body.listTitle}, {$push: {items: newItem}}, function(err, result){
      if(!err){
        resp.redirect("/"+req.body.listTitle);
      }
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.check;
  const listName = req.body.listTitle;
  if(listName === "Today"){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(!err){
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, result){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:pageName", function(req, res){
  const pageName = _.capitalize(req.params.pageName);
  List.findOne({name: pageName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const defaultList = new List({
          name: pageName,
          items: defaultItems
        });
        defaultList.save();
        res.redirect("/"+pageName);
      }
      else{
        res.render("list", {listTitle: pageName, newListItems: foundList.items, date: date.getDate()})
      }
    }
  });
});

app.listen(3000, function(){
  console.log("Server is listening at port 3000 and running.");
});
