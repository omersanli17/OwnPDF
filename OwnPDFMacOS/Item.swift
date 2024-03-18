//
//  Item.swift
//  OwnPDFMacOS
//
//  Created by ömer şanlı on 18.03.2024.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
