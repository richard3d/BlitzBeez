#pragma strict
class ItemProbability
{
	var item : GameObject = null;
	var probability : float = 0;
}

var ItemInventory : ItemProbability[];	//all probabilities in this array must sum to 100


function Start () {

}

function Update () {

}

function DropItem() : GameObject
{
	var x : float = Random.Range(1,100);
    var cumulative_probability : float = 0;
    for (var item : ItemProbability in ItemInventory) {
        cumulative_probability += item.probability;
        if (x <= cumulative_probability) {
            return item.item;
        }
    }
	return null;

}