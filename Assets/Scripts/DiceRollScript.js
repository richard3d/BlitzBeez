#pragma strict
static class Dice
{
	static function RollDice(numRolls : int, sides : int) : int
	{
		var sum : int = 0;
		for(var i : int = 0; i < numRolls; i++)
		{
				sum += Random.Range(1, sides);	
		}
		return sum;
	}
}

