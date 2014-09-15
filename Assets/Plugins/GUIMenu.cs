using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

//this is a class for returning selection information from a GUI menu
public class GUIMenuSelection
{
	public GUIMenu m_Menu; //which menu was the selection made from 
	public int m_SelIndex; //which item was selected from the menu (-1 = nothing)
	public GUIMenuSelection() {m_Menu = null; m_SelIndex = -1; }
	
	public GUIMenuItem GetMenuItem(int menuItemIndex)
	{
		return m_Menu.m_MenuItems[menuItemIndex];
	}
	
	public GUIMenu GetMenuItemSubMenu(int menuItemIndex) 
	{ 
		return GetMenuItem(menuItemIndex).m_SubMenu;
	}
	
	public GUIMenuItem[] GetMenuItemSubMenuItems(int menuItemIndex)
	{
		return GetMenuItem(menuItemIndex).m_SubMenu.m_MenuItems;
	}
	
	public GUIMenu GetSelectedMenuItemSubMenu()
	{
		return GetMenuItem(m_SelIndex).m_SubMenu;
	}
	
	public void ShowSel(bool show)
	{
		GetSelectedMenuItemSubMenu().m_Hidden = !show;
	}
}

[System.Serializable]
public class GUIMenuItem
{
	public string m_Text;
	public string m_Data;
	public GUIMenu m_SubMenu;
	public bool m_Enabled = true;
	
	public GUIMenuItem(String text, String data)
	{
		m_Text = text;
		m_Data = data;
		m_SubMenu = new GUIMenu();
		m_Enabled = true;
	}
	
	public void SetEnabled(bool bEnabled)
	{
		m_Enabled = bEnabled;
		m_SubMenu.Show(bEnabled);
	}
	
	public bool IsEnabled()
	{
		return m_Enabled;
	}
	
}

//Definition for GUI event types
public enum GUIEvent{ eMouseClick = 0, eMouseEnter = 1, eMouseExit =2};

//This class is intended as an interface for specific listeners to derive from
//Listeners are registered via the menu's event dispatcher
public interface GUIEventListener
{ 
	void OnItemClick(GUIMenu menu, int itemIndex );
	void OnItemMouseEnter(GUIMenu menu, int itemIndex );
	void OnItemMouseExit(GUIMenu menu, int itemIndex );
}

//This class provides the definition for an event dispatching system for Menu's to send events through
//The GUIMenu class contains a static member of this class
public class GUIEventDispatcher
{
	//listeners are registered to a specific menu, Note: The listener will receive events for that menus children as well
	private Dictionary<GUIMenu,List<GUIEventListener> > m_Listeners = new Dictionary<GUIMenu,List<GUIEventListener> >();
	
	public virtual void DispatchEvent(GUIEvent e, GUIMenu menu, int itemIndex) { 
	
		if (menu == null || !m_Listeners.ContainsKey(menu))
			return;
		
		for(int i = 0 ; i < m_Listeners[menu].Count; i++)
		{
			switch (e)
			{
				case GUIEvent.eMouseClick:
					m_Listeners[menu][i].OnItemClick(menu ,itemIndex);
					break;
				case GUIEvent.eMouseEnter:
						m_Listeners[menu][i].OnItemMouseEnter(menu ,itemIndex);
					break;
				case GUIEvent.eMouseExit:
						m_Listeners[menu][i].OnItemMouseExit(menu ,itemIndex);
					break;
				default:
					break;
			}
		}
	}
	
	//registers a listener to a particular menu (and its children)
	public virtual void RegisterEventListener(GUIMenu menu, GUIEventListener listener) {
	
		//recurse on our children
		for(int i = 0 ; i < menu.m_MenuItems.Length; i++)
		{
			if(menu.m_MenuItems[i].m_SubMenu != null && menu.m_MenuItems[i].m_SubMenu.m_MenuItems != null)
				if(menu.m_MenuItems[i].m_SubMenu.m_MenuItems.Length > 0)
					RegisterEventListener(menu.m_MenuItems[i].m_SubMenu,listener);
		}
		
		//first check if the menu has an entry in the listener dictionary already
		//if it doesnt create a new entry in the dictionary
		List<GUIEventListener> list;
		if (!m_Listeners.TryGetValue(menu, out list))
		{
			list = new List<GUIEventListener>();
			m_Listeners.Add(menu, list);
		}
		//add the listener
		list.Add(listener);
	}
}

[System.Serializable]
public class GUIMenu  {

	public GUIMenuItem[] m_MenuItems; //the list of menu items
	public Vector2 m_Position = new Vector2(4, 4);	// position offset relative to the parent
	public Vector2 m_MinimumSize = new Vector2(100, 25);	// minum size of an item
	public GUIStyle m_Style;
	public bool m_Hidden = true; //should we draw this menu and its children?
	public bool m_VerticalLayout = true; //determines if the items should be laid out in a vertical or horizontal fashion
	public bool m_ShowBackground = true; //determines if our list has a background
	public bool m_CascadeStyle = true;    //determines if 'our' style cascades down to children as well
	public static List<GUIMenuSelection> m_MenuSelStack = new List<GUIMenuSelection>(); //this represents the current history or ancestory of menus we have opened
	public static GUIMenuSelection m_FocusedItem = new GUIMenuSelection();				//this item is the current focused item (has mouse over it)
	
	private object m_OriginalStyle = null; // used to store the original store so can we toggle m_CascadeStyle in the inspector 
	private Vector2 m_Offset = Vector2.zero; 	// offset from 0,0
	private static GUIEventDispatcher MenuDispatcher = new GUIEventDispatcher();         //dispatcher that will fire off events
	
	public void RegisterEventListener(GUIEventListener listener)
	{
		MenuDispatcher.RegisterEventListener(this, listener);
	}
	
	public void DrawMenu()
	{
	
		if (m_Hidden || m_MenuItems == null)
		{
			return;
		}
	
		int numActiveItems = GetNumActiveMenuItems();
		GUIContent[] menuItemStrings = new GUIContent[numActiveItems];
		int strIndex = 0;
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			if(!m_MenuItems[i].IsEnabled())
				continue;
			
			//store the list of menu items as GUIContent for rendering below
			menuItemStrings[strIndex] = new GUIContent();
			
			menuItemStrings[strIndex].text = menuItemStrings[strIndex].tooltip = m_MenuItems[i].m_Text;

			//set children styles to the same as 'us' if we are cascading styles
			if (m_CascadeStyle)
			{
				//Debug.Log(m_MenuItems[i].m_Text);
				m_MenuItems[i].m_SubMenu.SetStyle(m_Style);
			}
			else
			{
				m_MenuItems[i].m_SubMenu.RevertStyle();
			}

			// add submenu symbol
			if (m_VerticalLayout)
			{
				if (m_MenuItems[i].m_SubMenu.m_MenuItems != null && m_MenuItems[i].m_SubMenu.m_MenuItems.Length > 0)
				{
					menuItemStrings[strIndex].text = "\u25BA " + menuItemStrings[strIndex].text;
				}
				else
				{
					menuItemStrings[strIndex].text = "    " + menuItemStrings[strIndex].text;
				}
			}
			strIndex++;
		}
		
		// calculate item width and height
		float itemHeight = GetItemHeight(menuItemStrings);
		float itemWidth = GetItemWidth(menuItemStrings);
		int counter = 0;	
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			
			if(!m_MenuItems[i].IsEnabled())
				continue;
			// position submenu items
			if (m_VerticalLayout)
			{
				m_MenuItems[i].m_SubMenu.SetOffsetX(GetGlobalX() + itemWidth);
				m_MenuItems[i].m_SubMenu.SetOffsetY(GetGlobalY() + itemHeight * counter);
				//if(m_MenuItems[i].m_Enabled)
					HitTestMenuItem(new Rect(GetGlobalX(), GetGlobalY()+ itemHeight * counter, itemWidth, itemHeight), i);
			}
			else
			{
				m_MenuItems[i].m_SubMenu.SetOffsetX(GetGlobalX() + itemWidth * counter);
				m_MenuItems[i].m_SubMenu.SetOffsetY(GetGlobalY() + itemHeight);
				//if(m_MenuItems[i].m_Enabled)
					HitTestMenuItem(new Rect(GetGlobalX() + itemWidth * counter, GetGlobalY(), itemWidth, itemHeight), i);
			}
			m_MenuItems[i].m_SubMenu.DrawMenu();
			counter++;
		}
		
		int itemsPerRow = 1;
		
		// set the container size of 'our' rect based on our layout
		// and calculate items per row
        Rect menuRect = new Rect(GetGlobalX(), GetGlobalY(), 0, 0);
		if (m_VerticalLayout)
		{
			menuRect.width = itemWidth;
			menuRect.height = numActiveItems * itemHeight;
		}
		else
		{
			menuRect.width = numActiveItems * itemWidth;
			menuRect.height = itemHeight;
			itemsPerRow = numActiveItems;
		}
		
		// draw a list background
		if (m_ShowBackground && menuItemStrings.Length > 0)
		{
	    	GUI.Box(menuRect, "", "box");
		}
		
		// draw the selection grid and get the selected index
		int selIndex = GUI.SelectionGrid(menuRect, -1, menuItemStrings, itemsPerRow, m_Style);
		if (selIndex != -1 )
		{
			selIndex = SelectionIndexToItemIndex(this, selIndex);
			if(m_MenuItems[selIndex].IsEnabled())
			{
			//this function handles the internal menu workings such as hiding and showing submenus etc
			OnItemClick(this, selIndex); 
			//dispatch the event to listeners who may want to override default functionality or do more with the event
			MenuDispatcher.DispatchEvent(GUIEvent.eMouseClick, this, selIndex);
		//	GUIRectManager.UnregisterRect(menuRect);
			}
		}
	}
	
	//this function is intended to affect the entire child hierarchy as well, use the member variable to only affect THIS menu
	public void Show(bool b)
	{
		if(m_MenuItems == null)
			return;
		m_Hidden = !b;
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			m_MenuItems[i].m_SubMenu.Show(b);
		}
	}
	
	public GUIMenuItem FindMenuItem(string menuItemData)
	{
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			if(m_MenuItems[i].m_Data == menuItemData)
			{
			
				return m_MenuItems[i];
			}
			else
			{		
				GUIMenuItem ret = m_MenuItems[i].m_SubMenu.FindMenuItem(menuItemData);
				if(ret != null)
					return ret;
			}
		}
		return null;
	}
	
	public int GetNumActiveMenuItems()
	{
		int count =  0;
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			if(m_MenuItems[i].IsEnabled())
			{
				count++;
			}
		}
		return count;
	}
	
	public void AppendMenuItem(GUIMenuItem item)
	{
		GUIMenuItem[] tempMenu = null; 
		if(m_MenuItems == null)
		{
			m_MenuItems = new GUIMenuItem[1];
			tempMenu = m_MenuItems;
		}
		else
		{
			tempMenu = new GUIMenuItem[m_MenuItems.Length+1];
		}
		
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			tempMenu[i] = m_MenuItems[i];
		}
		tempMenu[tempMenu.Length-1] = item;
		
		m_MenuItems = tempMenu;
	}
	
	public void EnableAll()
	{
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			m_MenuItems[i].SetEnabled(true);
			//m_MenuItems[i].m_SubMenu.EnableAll();
		}
	}
	
	public void SetMenuItemEnabled(int menuIndex, bool bEnabled)
	{
		m_MenuItems[menuIndex].SetEnabled(bEnabled);
	}
	
	public void SetMenuItemEnabled(string menuItemData, bool bEnabled)
	{
		for(int i = 0; i < m_MenuItems.Length; i++)
		{
			if(m_MenuItems[i].m_Data == menuItemData)
			{
				m_MenuItems[i].SetEnabled(bEnabled);
				return;
			}
		}
	}
	
	public void RemoveMenuItem(string menuItemData)
	{
		if (m_MenuItems != null)
		{
			int foundIndex = -1;
			for (int i = 0; i < m_MenuItems.Length; i++)
			{
				if (m_MenuItems[i].m_Data == menuItemData)
				{
					foundIndex = i;
					break;
				}
			}
			
			if (foundIndex != -1)
			{
				if (m_MenuItems.Length == 1)
				{
					m_MenuItems = null;
				}
				else
				{
					GUIMenuItem[] tempMenu = new GUIMenuItem[m_MenuItems.Length - 1];
					int j = 0;
					for (int i = 0; i < m_MenuItems.Length; i++)
					{
						if (i != foundIndex)
						{
							tempMenu[j] = m_MenuItems[i];
							j++;
						}
					}
					m_MenuItems = tempMenu;
				}
			}
		}
	}
	
	private void SetStyle(GUIStyle newStyle)
	{
		// store the original style
		if (m_OriginalStyle == null)
			m_OriginalStyle = m_Style;
		
		m_Style = newStyle;
	}

	private void RevertStyle()
	{
		if (m_OriginalStyle != null)
			m_Style = m_OriginalStyle as GUIStyle;
	}
	
	private float GetGlobalX()
	{
		return m_Offset.x + m_Position.x;
	}
	
	private float GetGlobalY()
	{
		return m_Offset.y + m_Position.y;
	}
	
	private void SetOffsetX(float x)
	{
		m_Offset.x = x;
	}
	
	private void SetOffsetY(float y)
	{
		m_Offset.y = y;
	}
	
	private float GetItemHeight(GUIContent[] guiContents)
	{
		float itemHeight = 0;
		if (guiContents.Length > 0)
		{
			itemHeight = m_Style.CalcHeight(guiContents[0], 1.0f);
		}
		return itemHeight;
	}
	
	private float GetItemWidth(GUIContent[] guiContents)
	{
		float minItemWidth = 0;
		float tempMinItemWidth = 0;
		float tempMaxItemWidth = 0;
		for (int i = 0; i < guiContents.Length; ++i)
		{
			m_Style.CalcMinMaxWidth(guiContents[i], out tempMinItemWidth, out tempMaxItemWidth);
			if (tempMinItemWidth > minItemWidth)
				minItemWidth = tempMinItemWidth;
		}
		minItemWidth = minItemWidth + m_Style.padding.horizontal;
		return minItemWidth;
	}
	
	//This method performs a hit test on a menu item rect
	//and fires the mouse enter and mouse exit events depending on the result
	private void HitTestMenuItem(Rect itemRect, int itemIndex) 
	{
		if (Event.current.type == EventType.Repaint)
		{
			if(itemRect.Contains(Event.current.mousePosition))
			{	
				//if the hit item is not the current focused item
				if(itemIndex != m_FocusedItem.m_SelIndex || this != m_FocusedItem.m_Menu)
				{
					//first exit previously focused item if there was one
					if(m_FocusedItem.m_SelIndex != -1)
					{
						MenuDispatcher.DispatchEvent(GUIEvent.eMouseExit, m_FocusedItem.m_Menu, m_FocusedItem.m_SelIndex);
						//GUIRectManager.UnregisterRect(itemRect);
					}
					//update and enter the new focused item
					m_FocusedItem.m_Menu = this;
					m_FocusedItem.m_SelIndex = itemIndex;
					//handle internal menu showing of submenus etc.
					Debug.Log("Enter");
					OnItemMouseEnter(m_FocusedItem.m_Menu, m_FocusedItem.m_SelIndex);
					MenuDispatcher.DispatchEvent(GUIEvent.eMouseEnter, m_FocusedItem.m_Menu, m_FocusedItem.m_SelIndex);
					
				//	if(!GUIRectManager.m_Rects.Contains(itemRect))
				//		GUIRectManager.RegisterRect(itemRect);
				}
			}
			else 
			{
				//we are not on this item and this item was previously mouse overed
				if(this == m_FocusedItem.m_Menu && itemIndex == m_FocusedItem.m_SelIndex)
				{
					//mouse exit on the item
					MenuDispatcher.DispatchEvent(GUIEvent.eMouseExit, this, itemIndex);
					//GUIRectManager.UnregisterRect(itemRect);
					m_FocusedItem.m_SelIndex = -1;
					m_FocusedItem.m_Menu = null;
				}
			}
		}
	}
	
	public int SelectionIndexToItemIndex(GUIMenu menu, int selIndex )
	{
		if (selIndex != -1)
		{
			int count = 0;
		
			for(int i = 0;  i < menu.m_MenuItems.Length; i++)
			{
				if(menu.m_MenuItems[i].IsEnabled())
				{
					if(count == selIndex)
					{
						return i;
					}
					else
						count++;
				}
			}
		}
		return -1;
	}
	
	public virtual void OnItemClick(GUIMenu menu, int itemIndex ) 
	{
		
		if (itemIndex != -1)
		{
			//only the top level menu items handle clicking
			if(m_MenuSelStack.Count == 0 || m_MenuSelStack[0].m_Menu == menu)
			{
				//if the item does not already exist push the item on the stack and make its submenu visible
				//otherwise just toggle the visibility of the submenu
				GUIMenuSelection menuSel = new GUIMenuSelection();
				menuSel.m_Menu = menu;
				menuSel.m_SelIndex = itemIndex;
				if (m_MenuSelStack.Find(x => (x.m_Menu == menuSel.m_Menu &&
					x.m_SelIndex == menuSel.m_SelIndex)) == null)
				{
					UnwindMenuSelStack(menuSel);
					m_MenuSelStack.Add(menuSel);
					menuSel.GetSelectedMenuItemSubMenu().m_Hidden = false;
				}
				else
				{
					//toggle visibility
					bool hidden = menuSel.GetSelectedMenuItemSubMenu().m_Hidden;
					
					if (hidden)
					{
						menuSel.ShowSel(true);
					}
					else
					{
						menuSel.GetSelectedMenuItemSubMenu().Show(false);
					}
				}
			}
		}
	}
	
	public virtual void OnItemMouseEnter(GUIMenu menu, int itemIndex ) 
	{
		//if this is the top level menu item we only expand if there is a sibling with an open menu
		if((m_MenuSelStack.Count > 0 && m_MenuSelStack[0].m_Menu == menu) || m_MenuSelStack.Count == 0)
		{
			bool expand = false;
			for(int i = 0;  i < menu.m_MenuItems.Length; i++)
			{
				if(!menu.m_MenuItems[i].m_SubMenu.m_Hidden)
				{
					expand = true;
					break;
				}
			}
			if(!expand)
				return;
		}
		
		//this stack keeps track of selections through the menu system
		if (itemIndex != -1)
		{
			//if the item does not already exist push the item on the stack and make its submenu visible
			//otherwise just toggle the visibility of the submenu
			GUIMenuSelection menuSel = new GUIMenuSelection();
			menuSel.m_Menu = menu;
			menuSel.m_SelIndex = itemIndex;
			if (m_MenuSelStack.Find(x => (x.m_Menu == menuSel.m_Menu &&
				x.m_SelIndex == menuSel.m_SelIndex)) == null)
			{
				UnwindMenuSelStack(menuSel);
				m_MenuSelStack.Add(menuSel);
				menuSel.GetSelectedMenuItemSubMenu().m_Hidden = false;
			}
			else
			{
				//toggle visibility
				bool hidden = menuSel.GetSelectedMenuItemSubMenu().m_Hidden;
				
				if (hidden)
				{
					menuSel.ShowSel(true);
				}
			}
		}
	}
	
	//this method will hide all shown menus in the stack based on the selection
	//if the selection exists in the stack then we toggle the visibility of the selection's submenu
	public void UnwindMenuSelStack(GUIMenuSelection sel)
	{
		//if null is passed in, unwind the stack all the way
		if (sel == null)
		{
			while (m_MenuSelStack.Count > 0)
			{
				m_MenuSelStack.Last().ShowSel(false);
				m_MenuSelStack.RemoveAt(m_MenuSelStack.Count-1);
			}
		}
		else
		{
			//unwind the stack to the selected menu, and hide all submenus in the stack
			while (m_MenuSelStack.Count > 0 &&
				sel.m_Menu != m_MenuSelStack.Last().GetSelectedMenuItemSubMenu())
			{
				m_MenuSelStack.Last().ShowSel(false);
				m_MenuSelStack.RemoveAt(m_MenuSelStack.Count-1);
			}
		}	
	}
}